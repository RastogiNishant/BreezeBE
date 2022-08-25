'use strict'

const BaseSerializer = require('./BaseSerializer')

class FilterColumnsSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false, isShort = false, extraFields = [], role = null } = options

    if (!isOwner || isShort) {
      item.tableName = undefined
      item.tableAlias = undefined
      item.used_global_search = undefined
      item.is_used_filter = undefined
      item.default_visible = undefined
      item.order = undefined
    }

    return this._getRowJSON(item)
  }
}

module.exports = FilterColumnsSerializer
