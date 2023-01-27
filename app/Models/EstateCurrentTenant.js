'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
const { STATUS_ACTIVE, STATUS_DRAFT, LETTING_TYPE_LET, ROLE_USER } = require('../constants')

class EstateCurrentTenant extends Model {
  static get columns() {
    return [
      'salutation',
      'email',
      'surname',
      'phone_number',
      'contract_end',
      'status',
      'salutation_int',
      'user_id',
      'attachments',
    ]
  }

  static get Serializer() {
    return 'App/Serializers/EstateCurrentTenantSerializer'
  }

  user() {
    return this.hasOne('App/Models/User', 'user_id', 'id').where('status', STATUS_ACTIVE)
  }

  inside_breeze() {
    return this.hasOne('App/Models/User', 'email', 'email')
      .where('status', STATUS_ACTIVE)
      .where('role', ROLE_USER)
  }

  estate() {
    return this.hasOne('App/Models/Estate', 'estate_id', 'id')
      .where('letting_status', LETTING_TYPE_LET)
      .whereIn('status', [STATUS_DRAFT])
  }
}

module.exports = EstateCurrentTenant
