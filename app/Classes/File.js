const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const { nth, isEmpty, isString, trim } = require('lodash')

const Logger = use('Logger')
const Drive = use('Drive')
const AppException = use('App/Exceptions/AppException')
const imageminPngquant = require('imagemin-pngquant')
const HttpException = use('App/Exceptions/HttpException')
const imageThumbnail = require('image-thumbnail')

class File {
  static IMAGE_JPG = 'image/jpg'
  static IMAGE_GIF = 'image/gif'
  static IMAGE_JPEG = 'image/jpeg'
  static IMAGE_PNG = 'image/png'
  static IMAGE_PDF = 'application/pdf'
  static MIME_DOC = 'application/msword'
  static MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  static MIME_EXCEL = 'application/vnd.ms-excel'
  static MIME_EXCELX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  static IMAGE_MIME_TYPE = {
    jpg: File.IMAGE_JPEG,
    png: File.IMAGE_PNG,
    gif: File.IMAGE_GIF,
  }

  static SUPPORTED_IMAGE_FORMAT = Object.keys(File.IMAGE_MIME_TYPE)

  static async createThumbnail(buffer) {
    try {
      const options = { width: parseInt(process.env.THUMB_WIDTH || '100') }
      const thumbnail = await imageThumbnail(buffer, options)
      return thumbnail
    } catch (e) {
      console.log('createThumbnail Error')
      return false
    }
  }

  /**
   *
   */
  static async saveToDisk(file, allowedTypes = [], isPublic = true) {
    let { ext, mime } = (await FileType.fromFile(file.tmpPath)) || {}
    if (!ext) {
      ext = file.extname || nth(file.clientName.toLowerCase().match(/\.([a-z]{3,4})$/i), 1)
    }

    if (!isEmpty(allowedTypes)) {
      if (!allowedTypes.includes(mime)) {
        throw new AppException('Invalid file mime type')
      }
    }

    try {
      let img_data = Drive.getStream(file.tmpPath)
      const image_compress_tick = process.env.IMAGE_COMPRESS_TICK || 10000
      if ([this.IMAGE_JPEG, this.IMAGE_PNG].includes(mime)) {
        const imagemin = (await import('imagemin')).default
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default

        img_data = (
          await imagemin([file.tmpPath], {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] }), imageminMozjpeg({ quality: 80 })],
          })
        )[0].data
      }

      const filename = `${uuid.v4()}.${ext}`
      const dir = moment().format('YYYYMM')
      const filePathName = `${dir}/${filename}`
      const disk = isPublic ? 's3public' : 's3'

      const options = { ContentType: file.headers['content-type'] }
      if (isPublic) {
        options.ACL = 'public-read'
      }
      await Drive.disk(disk).put(filePathName, img_data, options)

      let thumbnailFilePathName = null
      if ([this.IMAGE_JPEG, this.IMAGE_PNG].includes(mime)) {
        thumbnailFilePathName = await File.saveThumbnailToDisk({
          image: img_data,
          fileName: filename,
          dir: dir,
          options: options,
          disk: disk,
        })
      }

      return { filePathName: filePathName, thumbnailFilePathName: thumbnailFilePathName }
    } catch (e) {
      throw new AppException(e, 500)
    }
  }

  static async saveThumbnailToDisk({ image, fileName, dir, options, isUri, disk }) {
    try {
      const originalImage = image
      if (isUri) {
        image = { uri: image }
      }

      let thumbnail = await File.createThumbnail(image)
      if (thumbnail === false) {
        thumbnail = originalImage
      }

      const thumbnailFilePathName = `thumbnail/${dir}/thumb_${fileName}`
      await Drive.disk(disk).put(thumbnailFilePathName, thumbnail, options)
      return thumbnailFilePathName
    } catch (e) {
      console.log('Open image error', e)
      throw new HttpException('Open image HttpException error', e)
    }
  }

  /**
   *
   */
  static getPublicUrl(filePathName) {
    if (!filePathName) {
      return null
    }
    return Drive.disk('s3public').getUrl(filePathName)
  }

  /**
   * Get file protected url 15 min lifetime
   */
  static async getProtectedUrl(filePathName, expiry = 900, params) {
    if (!filePathName || trim(filePathName).length === 0) {
      return null
    }
    return await Drive.disk('s3').getSignedUrl(filePathName, expiry, params)
  }

  /**
   *
   */
  static async saveRequestFiles(request, fields = []) {
    if (isEmpty(fields)) {
      return {}
    }
    const saveFile = async ({ field, mime = null, isPublic = true }) => {
      const file = request.file(field, {
        size: process.env.MAX_IMAGE_SIZE || '20M',
        extnames: File.SUPPORTED_IMAGE_FORMAT,
      })
      if (!file) {
        return null
      }

      if (file.hasErrors) {
        throw new HttpException('Image has an error', 400)
      }

      const fileInfo = await Promise.all(
        (file._files || [file]).map(async (f) => {
          const { filePathName, thumbnailFilePathName } = await File.saveToDisk(f, mime, isPublic)
          const fileName = f.clientName
console.log('why not uploading?', filePathName )          
          return { filePathName, thumbnailFilePathName, fileName }
        })
      )
      const filePathName = fileInfo.map((fi) => fi.filePathName)
      const fileName = fileInfo.map((fi) => fi.fileName)
      const thumbnailFilePathName = fileInfo.map((fi) => fi.thumbnailFilePathName)

      return { field, filePathName, fileName, thumbnailFilePathName }
    }
    const files = await Promise.map(fields, saveFile)
console.log('FILESSSSS', files )
    return files.reduce(
      (n, v) =>
        v
          ? {
              ...n,
              [v.field]: v.filePathName.length > 1 ? v.filePathName : v.filePathName[0],
              [`original_${v.field}`]: v.fileName.length > 1 ? v.fileName : v.fileName[0],
              [`thumb_${v.field}`]:
                v.thumbnailFilePathName.length > 1
                  ? v.thumbnailFilePathName
                  : v.thumbnailFilePathName[0],
            }
          : n,
      {}
    )
  }

  /**
   *
   */
  static async logFile(data, filename = 'stream.log') {
    const filePath = path.join(process.cwd(), 'tmp/', filename)

    return new Promise((resolve) => {
      fs.writeFile(filePath, isString(data) ? data : JSON.stringify(data, null, 2), 'utf8', resolve)
    })
  }

  /**
   *
   */
  static async readLog(filename = 'stream.log') {
    const filePath = path.join(process.cwd(), 'tmp/', filename)

    return fs.readFileSync(filePath, 'utf8')
  }

  /**
   *
   */
  static async remove(file, isPublic = true) {
    const disk = isPublic ? 's3public' : 's3'
    return Drive.disk(disk).delete(file)
  }
}

module.exports = File
