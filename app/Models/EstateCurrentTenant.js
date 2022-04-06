'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class EstateCurrentTenant extends Model {
  static get columns() {
    return ['salutation', 'email', 'surname', 'phone_number', 'contract_end', 'status']
  }

  static get Serializer() {
    return 'App/Serializers/EstateCurrentTenantSerializer'
  }
}

module.exports = EstateCurrentTenant
