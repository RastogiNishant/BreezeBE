const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const { nth, isEmpty, isString, trim } = require('lodash')
const { SUPPORTED_IMAGE_FORMAT } = require('../constants')

const Logger = use('Logger')
const Drive = use('Drive')
const AppException = use('App/Exceptions/AppException')
const imageminPngquant = require('imagemin-pngquant')
const HttpException = use('App/Exceptions/HttpException')

class File {
  static IMAGE_JPG = 'image/jpg'
  static IMAGE_JPEG = 'image/jpeg'
  static IMAGE_PNG = 'image/png'
  static IMAGE_PDF = 'application/pdf'
  static MIME_DOC = 'application/msword'
  static MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  static MIME_EXCEL = 'application/vnd.ms-excel'
  static MIME_EXCELX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  /**
   *
   */
  static async saveToDisk(file, allowedTypes = [], isPublic = true) {
    let { ext, mime } = (await FileType.fromFile(file.tmpPath)) || {}
    Logger.info('File type', { mime })
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
      if (file.size > image_compress_tick && [this.IMAGE_JPEG, this.IMAGE_PNG].includes(mime)) {
        const imagemin = (await import('imagemin')).default
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default

        img_data = (
          await imagemin([file.tmpPath], {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] }), imageminMozjpeg({ quality: 80 })],
          })
        )[0].data
      }

      const filename = `${uuid.v4()}.${ext}`
      const filePathName = `${moment().format('YYYYMM')}/${filename}`
      const disk = isPublic ? 's3public' : 's3'
      const options = { ContentType: file.headers['content-type'] }
      if (isPublic) {
        options.ACL = 'public-read'
      }

      await Drive.disk(disk).put(filePathName, img_data, options)
      return filePathName
    } catch (e) {
      throw new HttpException(e, 500)
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
        extnames: SUPPORTED_IMAGE_FORMAT,
      })

      if (!file) {
        return null
      }

      if (file.hasErrors) {
        throw new HttpException(image.errors, 400)
      }

      const path = await File.saveToDisk(file, mime, isPublic)
      const fileName = file.clientName

      return { field, path, fileName }
    }
    const files = await Promise.map(fields, saveFile)

    return files.reduce(
      (n, v) => (v ? { ...n, [v.field]: v.path, [`original_${v.field}`]: v.fileName } : n),
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
