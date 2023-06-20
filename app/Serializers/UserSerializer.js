'use strict'
const BaseSerializer = require('./BaseSerializer')
const moment = require('moment')

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

    item = this._getRowJSON(item)

    if (item.created_at) {
      item.created_at = moment.utc(item.created_at).format()
    }
    if (item.updated_at) {
      item.updated_at = moment.utc(item.updated_at).format()
    }
    return item
  }
}

module.exports = UserSerializer
