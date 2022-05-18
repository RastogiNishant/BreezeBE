'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')

/**
 *
 */
class MemberSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.avatar) {
      item.avatar = File.getPublicUrl(item.avatar)
    }
    // if (item.rent_arrears_doc) {
    //   item.rent_arrears_doc = File.getProtectedUrl(item.rent_arrears_doc)
    // }
    // if (item.debt_proof) {
    //   item.debt_proof = File.getProtectedUrl(item.debt_proof)
    // }

    return this._getRowJSON(item)
  }
}

module.exports = MemberSerializer
