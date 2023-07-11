'use strict'
const BaseSerializer = require('./BaseSerializer')
const User = use('App/Models/User')
const { ROLE_USER } = require('../constants')
/**
 *
 */
class MarketPlaceSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    item = super.mergeData(item)
    item.knocked_at = item.created_at
    return item
  }
}

module.exports = MarketPlaceSerializer
