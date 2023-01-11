'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class FileSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk, type, order } = item

    return { id, url: Drive.disk(disk).getUrl(url), type, order }
  }
}

module.exports = FileSerializer
