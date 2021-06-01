'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class TenantSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isShort = false } = options
    if (item.coord_raw) {
      item.coord = item.coord_raw
    }
    item.coord_raw = undefined
    if (isShort) {
      this.filterFields(item)
    }

    return this._getRowJSON(item)
  }
}

module.exports = TenantSerializer
