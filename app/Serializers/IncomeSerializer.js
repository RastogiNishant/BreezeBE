'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')

/**
 *
 */
class IncomeSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false } = options
    if (item.company_logo) {
      item.company_logo = File.getPublicUrl(item.company_logo)
    }
    if(item.rent_arrears_doc){
      item.rent_arrears_doc = File.getPublicUrl(item.rent_arrears_doc)
    }
    if(item.debt_proof){
      item.debt_proof = File.getPublicUrl(item.debt_proof)
    }
    return this._getRowJSON(item)
  }
}

module.exports = IncomeSerializer
