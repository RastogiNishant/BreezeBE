'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')

/**
 *
 */
class MemberSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.avatar) {
      if (item.avatar?.search('http') !== 0) {
        item.avatar = File.getPublicUrl(item.avatar)
      }
      if (item.rent_arrears_doc?.search('http') !== 0) {
        item.rent_arrears_doc = File.getPublicUrl(item.rent_arrears_doc)
      }
      if (item.debt_proof?.search('http') !== 0) {
        item.debt_proof = File.getPublicUrl(item.debt_proof)
      }
    }
    return this._getRowJSON(item)
  }
}

module.exports = MemberSerializer
