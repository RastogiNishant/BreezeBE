'use strict'

const Model = require('./BaseModel')

class Company extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'name',
      'address',
      'avatar',
      'tax_number',
      'trade_register_nr',
      'umsst',
      'status',
      'size',
      'type',
    ]
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/CompanySerializer'
  }

  /**
   *
   */
  contacts() {
    return this.hasMany('App/Models/Contact', 'id', 'company_id')
  }
}

module.exports = Company
