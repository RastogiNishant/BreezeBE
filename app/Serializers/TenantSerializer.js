'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class TenantSerializer extends BaseSerializer {
  mergeData(item) {
    if (item.coord_raw) {
      item.coord = item.coord_raw
    }
    item.coord_raw = undefined

    return this._getRowJSON(item)
  }
}

module.exports = TenantSerializer
