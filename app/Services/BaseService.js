'use strict'
const HttpException = require('../Exceptions/HttpException')
const File = use('App/Classes/File')
const {
  exceptionCodes: { IMAGE_ABSOLUTE_URL_ERROR_CODE },
} = require('../exceptions')

class BaseService {
  static async getWithAbsoluteUrl(item) {
    try {
      if (item.attachments) {
        item.attachments = await Promise.all(
          item.attachments.map(async (attachment) => {
            const thumb =
              attachment.uri.split('/').length === 2
                ? await File.getProtectedUrl(
                    `thumbnail/${attachment.uri.split('/')[0]}/thumb_${
                      attachment.uri.split('/')[1]
                    }`
                  )
                : ''

            if (attachment.uri.search('http') !== 0) {
              return {
                ...attachment,
                url: await File.getProtectedUrl(attachment.uri),
                uri: attachment.uri,
                thumb: thumb,
              }
            }

            return {
              ...attachment,
              url: attachment.uri,
              uri: attachment.uri,
              thumb: thumb,
            }
          })
        )
      }
      return item
    } catch (e) {
      return null
    }
  }

  static async saveFiles(request, options = { mimes: null, fieldName: null, isPublic: false }) {
    const imageMimes = options?.mimes || [
      File.IMAGE_JPG,
      File.IMAGE_JPEG,
      File.IMAGE_PNG,
      File.IMAGE_PDF,
      File.IMAGE_TIFF,
      File.IMAGE_GIF,
      File.IMAGE_WEBP,
      File.IMAGE_HEIC,
    ]

    const files = await File.saveRequestFiles(request, [
      {
        field: options?.fieldName || 'file',
        mime: imageMimes,
        isPublic: options?.isPublic || false,
      },
    ])

    return files
  }

  static async getAbsoluteUrl(attachments, sender_id) {
    try {
      if (!attachments || !attachments.length) {
        return null
      }
      if (!Array.isArray(attachments)) {
        attachments = JSON.parse(attachments)
      }

      attachments = await Promise.all(
        attachments.map(async (attachment) => {
          const thumb =
            attachment.split('/').length === 2
              ? await File.getProtectedUrl(
                  `thumbnail/${attachment.split('/')[0]}/thumb_${attachment.split('/')[1]}`
                )
              : ''

          if (attachment.search('http') !== 0) {
            return {
              user_id: sender_id,
              url: await File.getProtectedUrl(attachment),
              uri: attachment,
              thumb: thumb,
            }
          }

          return {
            user_id: sender_id,
            url: attachment,
            uri: attachment,
            thumb: thumb,
          }
        })
      )
      return attachments
    } catch (e) {
      throw new HttpException(e.message, IMAGE_ABSOLUTE_URL_ERROR_CODE)
    }
  }
}

module.exports = BaseService
