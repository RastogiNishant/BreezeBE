'use strict'

const BaseSerializer = require('./BaseSerializer')
const File = require('../Classes/File')

/**
 *
 */
class CompanySerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    if (item.avatar) {
      if (item.avatar.search('http') !== 0) {
        item.avatar = File.getPublicUrl(item.avatar)
      }
    }
    return this._getRowJSON(item)
  }
}

module.exports = CompanySerializer
