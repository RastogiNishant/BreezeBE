'use strict'

const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class RoomSerializer extends BaseSerializer {
  mergeData(item) {
    const { id, url, disk } = item

    return { id, url: Drive.disk(disk).getUrl(url) }
  }
}

module.exports = RoomSerializer
