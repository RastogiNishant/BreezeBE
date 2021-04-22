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

    return this._getRowJSON(item)
  }
}

module.exports = RoomSerializer
