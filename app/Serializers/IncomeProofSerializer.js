'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')

/**
 *
 */
class IncomeProofSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false } = options
    // if (item.file) {
    //   item.file = File.getPublicUrl(item.file)
    // }
    return this._getRowJSON(item)
  }
}

module.exports = IncomeProofSerializer
