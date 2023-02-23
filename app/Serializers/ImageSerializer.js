'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class ImageSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk, order, file_name } = item

    return { id, url: Drive.disk(disk).getUrl(url), relativeUrl: url, order, file_name }
  }
}

module.exports = ImageSerializer
