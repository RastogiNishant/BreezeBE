'use strict'
const BaseSerializer = require('./BaseSerializer')
const User = use('App/Models/User')
const { ROLE_USER } = require('../constants')
/**
 *
 */
class EstateCurrentTenantSerializer extends BaseSerializer {
  mergeData(item, options = {}) {
    return this._getRowJSON(item)
  }
}

module.exports = EstateCurrentTenantSerializer
