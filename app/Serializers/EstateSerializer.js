'use strict'
const moment = require('moment')
const { isString, isEmpty, isDate } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')
const File = require('../Classes/File')
/**
 *
 */
class EstateSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false, isShort = false, extraFields = [], role = null } = options
    if (!isOwner && !extraFields.includes('hash')) {
      item.hash = undefined
    }

    item.coord = item.coord_raw
    item.coord_raw = undefined

    if (!extraFields.includes('verified_address')) {
      item.verified_address = !isEmpty(item.coord)
    }

    if (!extraFields.includes('construction_year') && isDate(item.construction_year)) {
      item.construction_year = moment(item.construction_year).format('YYYY')
    }

    // Get cover url
    if (isString(item.cover) && !item.cover.includes('http')) {
      if (!extraFields.includes('cover_thumb')) {
        item.cover_thumb =
          item.cover.split('/').length === 2
            ? File.getPublicUrl(
                `thumbnail/${item.cover.split('/')[0]}/thumb_${item.cover.split('/')[1]}`
              )
            : null
      }

      item.cover = File.getPublicUrl(item.cover)
    } else if (item?.cover?.includes('http')) {
      if (!extraFields.includes('cover_thumb')) {
        const splits = item.cover.split('/')
        const len = splits?.length || 0
        item.cover_thumb =
          len > 3
            ? File.getPublicUrl(
                `thumbnail/${item.cover.split('/')[len - 2]}/thumb_${
                  item.cover.split('/')[len - 1]
                }`
              )
            : null
      }
    }

    if (isString(item.energy_proof) && !item.energy_proof.includes('http')) {
      item.energy_proof = File.getPublicUrl(item.energy_proof)
    }

    if (isDate(item.last_modernization)) {
      item.last_modernization = moment(item.last_modernization).format('YYYY-MM-DD')
    }

    // const options = item.constructor.options
    this.applyOptionsSerializer(item, item.constructor.options)

    isShort && this.filterFields(item, extraFields)

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
