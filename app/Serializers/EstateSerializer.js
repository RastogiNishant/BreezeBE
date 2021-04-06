'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class EstateSerializer extends BaseSerializer {
  mergeData(item) {
    if (item.coord && item.coord.bindings) {
      const [lon, lat] = item.coord.bindings
      item.coord = `${lat},${lon}`
    }

    return this._getRowJSON(item)
  }
}

module.exports = EstateSerializer
