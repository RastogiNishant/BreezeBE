'use strict'

const { get } = require('lodash')
const BaseSerializer = require('./BaseSerializer')
const { POINT_TYPE_POI } = require('../constants')

/**
 *
 */
class PointSerializer extends BaseSerializer {
  mergeData(item) {
    if (item.type === POINT_TYPE_POI) {
      item.data = (get(item, 'data.data') || []).map((i) => ({
        id: i.id,
        coord: get(i, 'result.features.0.geometry.coordinates'),
      }))

      return this._getRowJSON(item)
    } else {
      const result = this._getRowJSON(item)
      result.data = get(item, 'data.data')

      return result
    }
  }
}

module.exports = PointSerializer
