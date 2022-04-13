'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const { STATUS_ACTIVE } = require('../constants')

class EstateCurrentTenant extends Model {
  static get columns() {
    return ['salutation', 'email', 'surname', 'phone_number', 'contract_end', 'status']
  }

  static get Serializer() {
    return 'App/Serializers/EstateCurrentTenantSerializer'
  }

  user() {
    return this.hasOne('App/Models/User', 'user_id', 'id').where('status', STATUS_ACTIVE)
  }
}

module.exports = EstateCurrentTenant
