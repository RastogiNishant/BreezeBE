'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */

const Model = require('./BaseModel')

class BillingAddress extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'name',
      'phone',
      'address',
      'address1',
      'country',
      'city',
      'zipcode'
    ]
  }

  /**
   *
   */
  static get readonly() {
    return [
        'id',
        'user_id',
    ]
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/BillingAddressSerializer'
  }

}

module.exports = BillingAddress
