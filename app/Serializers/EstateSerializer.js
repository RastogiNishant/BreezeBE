'use strict'
const moment = require('moment')
const { isString, get, isArray, isDate } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')

/**
 *
 */
class EstateSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false } = options
    if (!isOwner) {
      item.hash = undefined
    }

    if (item.coord_raw) {
      item.coord = item.coord_raw
      item.coord_raw = undefined
    }

    // Get cover url
    if (isString(item.cover)) {
      item.cover = Drive.disk('s3public').getUrl(item.cover)
    }

    if (isDate(item.construction_year)) {
      item.construction_year = moment(item.construction_year).format('YYYY-MM-DD')
    }
    if (isDate(item.last_modernization)) {
      item.last_modernization = moment(item.last_modernization).format('YYYY-MM-DD')
    }

    // const options = item.constructor.options
    this.applyOptionsSerializer(item, item.constructor.options)

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
