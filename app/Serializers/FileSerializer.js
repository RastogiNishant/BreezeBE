'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class FileSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk, type, file_name } = item

    return { id, url: Drive.disk(disk).getUrl(url), type, file_name }
  }
}

module.exports = FileSerializer
