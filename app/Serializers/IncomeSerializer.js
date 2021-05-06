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
    return this._getRowJSON(item)
  }
}

module.exports = IncomeSerializer
