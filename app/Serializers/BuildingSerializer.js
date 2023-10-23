'use strict'

const BaseSerializer = require('./BaseSerializer')
const { generateAddress } = use('App/Libs/utils')
/**
 *
 */
class BuildingSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item.address = generateAddress(item)
    return this._getRowJSON(item)
  }
}

module.exports = BuildingSerializer
