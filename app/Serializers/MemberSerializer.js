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
    return this._getRowJSON(item)
  }
}

module.exports = MemberSerializer
