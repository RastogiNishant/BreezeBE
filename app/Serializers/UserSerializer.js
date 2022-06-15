'use strict'
const BaseSerializer = require('./BaseSerializer')

/**
 *
 */
class UserSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    const { isOwner = false, publicOnly = true, basicFields = false } = options

    if (isOwner) {
      return this._getRowJSON(item)
    }

    if (publicOnly) {
      item.email = undefined
      item.phone = undefined
      item.birthday = undefined
    }

    if (basicFields) {
      if (item.secondname != null) {
        item.name = item.firstname + ' ' + item.secondname
      } else {
        item.name = item.firstname
      }
      item.firstname = undefined
      item.secondname = undefined
      item.location = item.coord
      item.coord = undefined
      item.contact = item.phone
      item.activationStatus = item.approved_landlord
      item.requestedOn = item.created_at
      item.approved_landlord = undefined
      item.created_at = undefined
    }

    return this._getRowJSON(item)
  }
}

module.exports = UserSerializer
