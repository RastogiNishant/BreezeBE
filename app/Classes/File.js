const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const { nth, isEmpty, isString, trim } = require('lodash')
const AWS = require('aws-sdk')
const Env = use('Env')

const Logger = use('Logger')
const Drive = use('Drive')
const AppException = use('App/Exceptions/AppException')
const imageminPngquant = require('imagemin-pngquant')
const HttpException = use('App/Exceptions/HttpException')
const imageThumbnail = require('image-thumbnail')
const exec = require('node-async-exec')
const fsPromise = require('fs/promises')
const heicConvert = require('heic-convert')
const axios = require('axios')
const { GEWOBAG_FTP_BUCKET } = require('../constants')
const PDF_TEMP_PATH = process.env.PDF_TEMP_DIR || '/tmp/uploads'

class File {
  static IMAGE_JPG = 'image/jpg'
  static IMAGE_GIF = 'image/gif'
  static IMAGE_JPEG = 'image/jpeg'
  static IMAGE_PNG = 'image/png'
  static IMAGE_TIFF = 'image/tiff'
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
    tiff: File.IMAGE_TIFF,
    webp: File.IMAGE_WEBP,
    heic: File.IMAGE_HEIC
  }

  static SUPPORTED_IMAGE_FORMAT = Object.keys(File.IMAGE_MIME_TYPE)

  static async createThumbnail(buffer) {
    try {
      const options = {
        width: parseInt(process.env.THUMB_WIDTH || '100'),
        jpegOptions: { force: true, quality: 90 }
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
        cmd: `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/screen  -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputFileName} ${filePath}`
      })
      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      throw new AppException(e.message, e.status || 500)
    }
  }

  static async compressWebp(filePath, options = {}) {
    try {
      // need to install gifsicle to linux so this shell will work.
      // need to give read/write permission to tmp directly
      const webp = require('webp-converter')

      const outputFileName = `${PDF_TEMP_PATH}/output_${uuid.v4()}.webp`

      const saveFile = async (filePath) => {
        return new Promise((resolve, reject) => {
          const result = webp.cwebp(filePath, outputFileName, '-q 30')
          result
            .then((response) => {
              resolve(response)
            })
            .catch((e) => {
              reject(e)
            })
        })
      }
      await saveFile(filePath)
      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      console.log('compress webp error=', e)
      throw new AppException(e?.message || 'Error compress webp', 500)
    }
  }

  static async convertTiffToJPG(filePath) {
    try {
      // need to install gifsicle to linux so this shell will work.
      // need to give read/write permission to tmp directly

      const outputFileName = `${PDF_TEMP_PATH}/output_${uuid.v4()}.jpg`

      // gifsicle -i /srv/temp/sample_1920×1280.gif  --optimize=3 --lossy=80  --colors 256 --output /srv/temp/sample.gif

      const command = `convert ${filePath} ${outputFileName}`
      await exec({
        cmd: `${command}`
      })

      const data = await fsPromise.readFile(outputFileName)
      fsPromise.unlink(outputFileName)
      return data
    } catch (e) {
      console.log('convert tiff to jpg error=', e)
      throw new AppException(e?.message || 'Error convert tiff to jpg', e.status || 500)
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
      let isCompressed = true
      if ([this.IMAGE_TIFF, this.IMAGE_GIF].includes(mime)) {
        img_data = await this.convertTiffToJPG(file.tmpPath)
        ext = `jpg`
        contentType = File.IMAGE_JPEG
        mime = this.IMAGE_JPEG
      } else if ([this.IMAGE_HEIC].includes(mime)) {
        const inputBuffer = await fsPromise.readFile(file.tmpPath)
        img_data = await heicConvert({
          buffer: inputBuffer, // the HEIC file buffer
          format: 'JPEG', // output format
          quality: 0.1 // the jpeg compression quality, between 0 and 1
        })

        ext = `jpg`
        contentType = File.IMAGE_JPEG
      } else if ([this.IMAGE_WEBP].includes(mime)) {
        img_data = await this.compressWebp(file.tmpPath, { quality: 50 })
      } else if ([this.IMAGE_JPEG, this.IMAGE_PNG].includes(mime)) {
        const imagemin = (await import('imagemin')).default
        const imageminMozjpeg = (await import('imagemin-mozjpeg')).default

        if (img_data) {
          img_data = await imagemin.buffer(img_data, {
            plugins: [imageminPngquant({ quality: [0.6, 0.8] }), imageminMozjpeg({ quality: 80 })]
          })
        } else {
          try {
            img_data = (
              await imagemin([file.tmpPath], {
                plugins: [
                  imageminPngquant({ quality: [0.6, 0.8] }),
                  imageminMozjpeg({ quality: 80 })
                ]
              })
            )?.[0]?.data
          } catch (e) {
            try {
              img_data = Drive.getStream(file.tmpPath)
              isCompressed = false
            } catch (e) {
              throw new HttpException(e.message, 400)
            }
          }
        }
      } else if ([this.IMAGE_PDF].includes(mime)) {
        img_data = await this.compressPDF(file.tmpPath)
      } else {
        img_data = await fsPromise.readFile(file.tmpPath)
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
          image: isCompressed ? img_data : file.tmpPath,
          fileName: filename,
          dir,
          options,
          disk
        })
      }

      return {
        filePathName,
        thumbnailFilePathName
      }
    } catch (e) {
      throw new AppException(e, 400)
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
        thumbnail = Drive.getStream(originalImage)
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
    if (Array.isArray(filePathName)) {
      const protectedUrls = await Promise.map(filePathName, async (file) => {
        if (file && trim(file).length > 0) {
          return await Drive.disk('s3').getSignedUrl(file, expiry, params)
        }
      })
      return protectedUrls
    } else {
      if (!filePathName || trim(filePathName).length === 0) {
        return null
      }
      return await Drive.disk('s3').getSignedUrl(filePathName, expiry, params)
    }
  }

  static filesCount(request, field) {
    const file = request.file(field)
    if (!file || file.hasErrors) {
      return 0
    }

    if (file._files) {
      return file._files.length
    }

    return 1
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
        extnames: mime || File.SUPPORTED_IMAGE_FORMAT
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
      const fileFormat = (file._files || [file]).map((fi) => fi.headers['content-type'])
      return { field, filePathName, fileName, thumbnailFilePathName, fileFormat }
    }

    try {
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
                format: v.fileFormat.length > 1 ? v.fileFormat : v.fileFormat[0]
              }
            : n,
        {}
      )
    } catch (e) {
      throw new HttpException(e.message, e.status || 400)
    }
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
    if (!file || (Array.isArray(file) && !file?.length)) {
      return true
    }

    file = Array.isArray(file) ? file : [file]

    await Promise.map(file, async (dfile) => {
      await Drive.disk(disk).delete(dfile)
    })
    return true
  }

  static async saveFileTo({ url, ext = 'jpg' }) {
    try {
      const TEMP_PATH = PDF_TEMP_PATH
      const outputFileName = `${TEMP_PATH}/output_${uuid.v4()}.${ext}`
      Logger.info(`bucket URL ${url}`)
      Logger.info(`Local path ${outputFileName}`)

      const writeFile = async (data, outputFileName) => {
        try {
          await fsPromise.writeFile(outputFileName, data, { flag: 'wx' })
          Logger.info(`successfully wrote ${url} at ${new Date().toISOString()}`)
        } catch (e) {
          if (!fs.existsSync(TEMP_PATH)) {
            Logger.error(`Temp Directory Not Exists!`)
          }
          Logger.info(
            `failed to write ${url} to ${outputFileName} at ${new Date().toISOString()} ${
              e.message || e
            }`
          )
          throw new HttpException(e.message || e, 400)
        }
      }

      const download = async (url, isPublic = true) => {
        const disk = isPublic ? 's3public' : 's3'
        return await Drive.disk(disk).getStream(url)
        // return new Promise((resolve, reject) => {
        //   axios
        //     .get(url, {
        //       responseType: 'arraybuffer',
        //     })
        //     .then(async (response) => {
        //       Logger.info(`downloaded from s3 bucket ${url} at ${new Date().toISOString()}`)

        //       // response.data is an empty object
        //       resolve(response)
        //     })
        //     .catch((e) => {
        //       Logger.error(`s3 bucket downloaded error ${e.message || e}`)
        //       reject(e)
        //     })
        // })
      }

      const response = await download(url)
      await writeFile(response, outputFileName)
      return outputFileName
    } catch (e) {
      Logger.error(`File saved error ${e.message}`)
      throw new HttpException('File saved failed. Please try again', 400)
    }
  }

  static async getGewobagUploadedContent(filesWorked) {
    try {
      AWS.config.update({
        accessKeyId: Env.get('S3_KEY'),
        secretAccessKey: Env.get('S3_SECRET'),
        region: Env.get('S3_REGION')
      })
      const s3 = new AWS.S3()
      const params = {
        Bucket: GEWOBAG_FTP_BUCKET,
        Delimiter: '/',
        Prefix: 'live/'
      }
      const objects = await s3.listObjects(params).promise()
      if (!objects?.Contents) {
        return []
      }

      let xmls = []
      let filesLastModified = []
      for (let i = 0; i < objects.Contents.length; i++) {
        const fileLastModifiedOnRecord = filesWorked[objects.Contents[i].Key] || null
        if (
          objects.Contents[i].Key.match(/\.xml$/) &&
          moment(new Date(objects.Contents[i].LastModified)).utc().format() !==
            fileLastModifiedOnRecord
        ) {
          const xml = await Drive.disk('breeze-ftp-files').get(objects.Contents[i].Key)
          xmls = [...xmls, xml]
          filesLastModified = {
            ...filesLastModified,
            [objects.Contents[i].Key]: objects.Contents[i].LastModified
          }
        }
      }
      return {
        xml: xmls,
        filesLastModified
      }
    } catch (err) {
      console.log('getGewobagUploadedContent', err)
      return []
    }
  }
}

module.exports = File
