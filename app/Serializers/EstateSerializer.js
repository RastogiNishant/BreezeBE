'use strict'
const moment = require('moment')
const { isString, each, get, isDate } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')

/**
 *
 */
class EstateSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false, isShort = false, extraFields = [], role = null } = options
    if (!isOwner) {
      item.hash = undefined
    }

    item.coord = item.coord_raw
    item.coord_raw = undefined

    // Get cover url
    if (isString(item.cover)) {
      item.cover = Drive.disk('s3public').getUrl(item.cover)
    }

    if (isDate(item.construction_year)) {
      item.construction_year = moment(item.construction_year).format('YYYY')
    }
    if (isDate(item.last_modernization)) {
      item.last_modernization = moment(item.last_modernization).format('YYYY-MM-DD')
    }

    // const options = item.constructor.options
    this.applyOptionsSerializer(item, item.constructor.options)

    isShort && this.filterFields(item, extraFields)

    if (role != null && role === 3) {
      if (item.full_address === false) {
        item.coord = undefined
        item.street = undefined
        item.house_number = undefined
      }
    }

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
