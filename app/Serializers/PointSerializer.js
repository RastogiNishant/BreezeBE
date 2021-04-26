'use strict'

const { get } = require('lodash')
const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class PointSerializer extends BaseSerializer {
  mergeData(item) {
    item.data = (get(item, 'data.data') || []).map((i) => ({
      id: i.id,
      coord: get(i, 'result.features.0.geometry.coordinates'),
    }))
    return this._getRowJSON(item)
  }
}

module.exports = PointSerializer
