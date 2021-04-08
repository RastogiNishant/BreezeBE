'use strict'

const { isString, get, isArray } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const Drive = use('Drive')

/**
 *
 */
class EstateSerializer extends BaseSerializer {
  mergeData(item) {
    if (item.coord) {
      if (item.coord.bindings) {
        const [lon, lat] = item.coord.bindings
        item.coord = `${lat},${lon}`
      } else if (isString(item.coord)) {
        try {
          const [lon, lat] = get(JSON.parse(item.coord), 'coordinates')
          item.coord = `${lat},${lon}`
        } catch (e) {
          item.coord = null
        }
      }
    }
    // Get plan urls
    if (isString(item.plan)) {
      try {
        item.plan = JSON.parse(item.plan)
      } catch (e) {}
    }
    item.plan = isArray(item.plan) ? item.plan.map((i) => Drive.disk('s3public').getUrl(i)) : null
    // Get cover url
    if (isString(item.cover)) {
      item.cover = Drive.disk('s3public').getUrl(item.cover)
    }

    // const options = item.constructor.options
    this.applyOptionsSerializer(item, item.constructor.options)

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
