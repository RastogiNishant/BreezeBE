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
const exec = require('node-async-exec')
const fsPromise = require('fs/promises')
const heicConvert = require('heic-convert')
const PDF_TEMP_PATH = process.env.PDF_TEMP_DIR || '/tmp'

class File {
  static IMAGE_JPG = 'image/jpg'
  static IMAGE_GIF = 'image/gif'
  static IMAGE_JPEG = 'image/jpeg'
  static IMAGE_PNG = 'image/png'
  static IMAGE_WEBP = 'image/webp'
  static IMAGE_PDF = 'application/pdf'
  static IMAGE_HEIC = 'image/heif'
  static MIME_DOC = 'application/msword'
  static MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  static MIME_EXCEL = 'application/vnd.ms-excel'
  static MIME_EXCELX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  static IMAGE_MIME_TYPE = {
    jpg: File.IMAGE_JPEG,
    png: File.IMAGE_PNG,
    gif: File.IMAGE_GIF,
    webp: File.IMAGE_WEBP,
    heic: File.IMAGE_HEIC,
  }

  static SUPPORTED_IMAGE_FORMAT = Object.keys(File.IMAGE_MIME_TYPE)

  static async createThumbnail(buffer) {
    try {
      const options = {
        width: parseInt(process.env.THUMB_WIDTH || '100'),
        jpegOptions: { force: true, quality: 90 },
      }
      const thumbnail = await imageThumbnail(buffer, options)
      return thumbnail
    } catch (e) {
      console.log('createThumbnail Error')
      return false
    }
  }

  static async compressPDF(filePath) {
    try {
      // need to install ghostscript to linux so this shell will work.
      // need to give read/write permission to tmp directly

      const outputFileName = `${PDF_TEMP_PATH}/output_${uuid.v4()}.pdf`
      await exec({
        cmd: `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen  -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputFileName} ${filePath}`,
      })
      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      throw new AppException(e.message, 500)
    }
  }

  static async compressGif(filePath, options = {}) {
    try {
      // need to install gifsicle to linux so this shell will work.
      // need to give read/write permission to tmp directly

      const outputFileName = `${PDF_TEMP_PATH}/output_${uuid.v4()}.gif`

      //gifsicle -i /srv/temp/sample_1920×1280.gif  --optimize=3 --lossy=80  --colors 256 --output /srv/temp/sample.gif

      let command = `gifsicle -i ${filePath} `
      if (options.optimize) {
        command += ` --optimize=${options.optimize}`
      }
      if (options.lossy) {
        command += ` --lossy=${options.lossy}`
      }
      if (options.colors) {
        command += ` --colors=${options.colors}`
      }

      command += ` --output ${outputFileName}`
      await exec({
        cmd: `${command}`,
      })

      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      console.log('compress gif error=', e)
      throw new AppException(e?.message || 'Error compress gif', 500)
    }
  }

  static async compressWebp(filePath, options = {}) {
    try {
      // need to install gifsicle to linux so this shell will work.
      // need to give read/write permission to tmp directly

      const outputFileName = `${PDF_TEMP_PATH}/output_${uuid.v4()}.webp`

      //gifsicle -i /srv/temp/sample_1920×1280.gif  --optimize=3 --lossy=80  --colors 256 --output /srv/temp/sample.gif

      let command = `cwebp -quiet true ${filePath} `
      if (options.quality) {
        command += ` -q ${options.quality}`
      }
      command += ` -o ${outputFileName}`
      await exec({
        cmd: `${command}`,
      })

      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      console.log('compress webp error=', e)
      throw new AppException(e?.message || 'Error compress webp', 500)
    }
  }
  /**
   *
   */
  static async saveToDisk(file, allowedTypes = [], isPublic = true) {
    let { ext, mime } = (await FileType.fromFile(file.tmpPath)) || {}
    let contentType = file.headers['content-type']
    if (!ext) {
      ext = file.extname || nth(file.clientName.toLowerCase().match(/\.([a-z]{3,4})$/i), 1)
    }

    if (!isEmpty(allowedTypes)) {
      if (!allowedTypes.includes(mime)) {
        throw new AppException('Invalid file mime type')
      }
    }

    try {
      // let img_data = Drive.getStream(file.tmpPath)
      let img_data
      if ([this.IMAGE_HEIC].includes(mime)) {
        const inputBuffer = await fsPromise.readFile(file.tmpPath)
        img_data = await heicConvert({
          buffer: inputBuffer, // the HEIC file buffer
          format: 'JPEG', // output format
          quality: 0.1, // the jpeg compression quality, between 0 and 1
        })

        ext = `jpg`
        contentType = File.IMAGE_JPEG
      } else if ([this.IMAGE_GIF].includes(mime)) {
        img_data = await this.compressGif(file.tmpPath, { optimize: 3, lossy: 80, colors: 128 })
      } else if ([this.IMAGE_WEBP]) {
        img_data = await this.compressWebp(file.tmpPath, { quality: 50 })
      } else if ([this.IMAGE_JPEG, this.IMAGE_PNG].includes(mime)) {
        const imagemin = (await import('imagemin')).default
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default
        img_data = (
          await imagemin([file.tmpPath], {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] }), imageminMozjpeg({ quality: 80 })],
          })
        )[0].data
      } else if ([this.IMAGE_PDF].includes(mime)) {
        img_data = await this.compressPDF(file.tmpPath)
      }

      const filename = `${uuid.v4()}.${ext}`
      const dir = moment().format('YYYYMM')
      const filePathName = `${dir}/${filename}`
      const disk = isPublic ? 's3public' : 's3'
      const options = { ContentType: contentType }
      if (isPublic) {
        options.ACL = 'public-read'
      }
      await Drive.disk(disk).put(filePathName, img_data, options)

      let thumbnailFilePathName = null
      if ([this.IMAGE_JPEG, this.IMAGE_PNG, this.IMAGE_GIF, this.IMAGE_WEBP].includes(mime)) {
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
        extnames: mime ? mime : File.SUPPORTED_IMAGE_FORMAT,
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
          return { filePathName, thumbnailFilePathName, fileName }
        })
      )
      const filePathName = fileInfo.map((fi) => fi.filePathName)
      const fileName = fileInfo.map((fi) => fi.fileName)
      const thumbnailFilePathName = fileInfo.map((fi) => fi.thumbnailFilePathName)

      return { field, filePathName, fileName, thumbnailFilePathName }
    }
    const files = await Promise.map(fields, saveFile)
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
