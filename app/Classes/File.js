const FileType = require('file-type')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const { nth, isEmpty } = require('lodash')

const Logger = use('Logger')
const Drive = use('Drive')
const AppException = use('App/Exceptions/AppException')

class File {
  static IMAGE_JPG = 'image/jpeg'
  static IMAGE_PNG = 'image/png'
  static IMAGE_PDF = 'application/pdf'

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
        throw AppException('Invalid file mime type')
      }
    }

    const filename = `${uuid.v4()}.${ext}`
    const filePathName = `${moment().format('YYYYMM')}/${filename}`
    const disk = isPublic ? 's3public' : 's3'
    const options = { ContentType: file.headers['content-type'] }
    if (isPublic) {
      options.ACL = 'public-read'
    }

    await Drive.disk(disk).put(filePathName, Drive.getStream(file.tmpPath), options)

    return filePathName
  }

  /**
   *
   */
  static getPublicUrl(filePathName) {
    return Drive.disk('s3public').getUrl(filePathName)
  }

  /**
   * Get file protected url 15 min lifetime
   */
  static async getProtectedUrl(filePathName, expiry = 900, params) {
    return Drive.disk('s3').getSignedUrl(filePathName, expiry, params)
  }

  /**
   *
   */
  static async saveRequestFiles(request, fields = []) {
    if (isEmpty(fields)) {
      return {}
    }

    const saveFile = async ({ field, mime = null, isPublic = true }) => {
      const file = request.file(field)
      if (!file) {
        return null
      }
      const path = await File.saveToDisk(file, mime, isPublic)

      return { field, path }
    }
    const files = await Promise.map(fields, saveFile)

    return files.reduce((n, v) => (v ? { ...n, [v.field]: v.path } : n), {})
  }
}

module.exports = File
