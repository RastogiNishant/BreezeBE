'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class BillingAddressSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    
    return this._getRowJSON(item)
  }
}

module.exports = BillingAddressSerializer
