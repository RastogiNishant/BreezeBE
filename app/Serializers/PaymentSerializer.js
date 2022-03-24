'use strict'

const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class PaymentSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    
    return this._getRowJSON(item)
  }
}

module.exports = PaymentSerializer
