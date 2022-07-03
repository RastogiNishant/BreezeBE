'use strict'

const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')

class TaskSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.attachments) {
      item.attachments = item.attachments.map((attachment) => {
        const thumb =
          attachment.uri.split('/').length === 2
            ? File.getPublicUrl(
                `thumbnail/${attachment.uri.split('/')[0]}/thumb_${attachment.uri.split('/')[1]}`
              )
            : ''
        if (attachment.uri.search('http') !== 0) {
          return {
            user_id: attachment.user_id,
            url: Drive.disk('s3public').getUrl(attachment.uri),
            uri: attachment.uri,
            thumb: thumb,
          }
        }
        return {
          user_id: attachment.user_id,
          url: attachment.uri,
          uri: attachment.uri,
          thumb: thumb,
        }
      })
    }
    return this._getRowJSON(item)
  }
}

module.exports = TaskSerializer
