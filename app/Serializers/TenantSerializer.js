'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class TenantSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isShort = false, extraFields = [] } = options
    if (item.coord_raw) {
      item.coord = item.coord_raw
    }
    item.coord_raw = undefined
    isShort && this.filterFields(item, extraFields)

    return this._getRowJSON(item)
  }
}

module.exports = TenantSerializer
