'use strict'

const { isString, isArray } = require('lodash')
const Drive = use('Drive')

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class RoomSerializer extends BaseSerializer {
  mergeData(item) {
    if (isString(item.options)) {
      try {
        item.options = JSON.parse(item.options)
      } catch (e) {
        item.options = null
      }
    }

    if (isString(item.images)) {
      try {
        item.images = JSON.parse(item.images)
      } catch (e) {}
      item.images = isArray(item.images)
        ? item.images.map((i) => Drive.disk('s3public').getUrl(i))
        : null
    }

    return this._getRowJSON(item)
  }
}

module.exports = RoomSerializer
