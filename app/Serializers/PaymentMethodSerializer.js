'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class PaymentMethodSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    
    return this._getRowJSON(item)
  }
}

module.exports = PaymentMethodSerializer
