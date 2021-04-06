'use strict'

const { isString, get } = require('lodash')
const BaseSerializer = require('./BaseSerializer')

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

    // const options = item.constructor.options
    this.optionsSerializer(item, item.constructor.options)

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
