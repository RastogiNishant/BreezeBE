'use strict'
const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class UserSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false, publicOnly = true } = options
    if (isOwner) {
      return this._getRowJSON(item)
    }

    if (publicOnly) {
      item.email = undefined
      item.phone = undefined
      item.birthday = undefined
    }

    return this._getRowJSON(item)
  }
}

module.exports = UserSerializer
