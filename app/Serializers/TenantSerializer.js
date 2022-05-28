'use strict'

const { MATCH_STATUS_FINISH } = require('../constants')
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

    let isShown = isShort
    if( item.share || item.status === MATCH_STATUS_FINISH ){
      isShown = false
    }
    isShown && this.filterFields(item, extraFields)

    return this._getRowJSON(item)
  }
}

module.exports = TenantSerializer
