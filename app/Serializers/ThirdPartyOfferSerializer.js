'use strict'
const BaseSerializer = require('./BaseSerializer')

class ThirdPartyOfferSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item.coord = item.coord_raw
    item.coord_raw = undefined

    return this._getRowJSON(item)
  }
}

module.exports = ThirdPartyOfferSerializer
