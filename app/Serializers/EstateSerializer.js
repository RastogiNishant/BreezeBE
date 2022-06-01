'use strict'
const moment = require('moment')
const { isString, each, get, isDate } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')
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
    item.verified_address = item.coord !== null

    // Get cover url
    if (isString(item.cover) && !item.cover.includes('http')) {
      item.cover = File.getPublicUrl(item.cover)
    }

    if (isString(item.energy_proof) && !item.energy_proof.includes('http')) {
      item.energy_proof = File.getPublicUrl(item.energy_proof)
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
