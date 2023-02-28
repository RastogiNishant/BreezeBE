'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class ImageSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk, order, room_id, file_name } = item

    return { id, url: Drive.disk(disk).getUrl(url), relativeUrl: url, order, room_id, file_name }
  }
}

module.exports = ImageSerializer
