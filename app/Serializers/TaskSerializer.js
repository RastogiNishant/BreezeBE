'use strict'

const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')

class TaskSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.attachements) {
      item.attachements.map((attachment) => {
        if (attachment.search('http') !== 0) {
          return { url: Drive.disk(disk).getUrl(attachment.uri), uri: attachment.uri }
        }
        return { url: attachment.uri, relativeUrl: attachment.uri }
      })
    }
    return this._getRowJSON(item)
  }
}

module.exports = TaskSerializer
