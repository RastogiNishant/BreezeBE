'use strict'

const Model = require('./BaseModel')

class Tenant extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'landlord_name',
      'address',
      'rent_arrears_doc',
      'credit_score',
      'debt_doc',
      'unpaid_rental',
      'insolvency_proceed',
      'arrest_warranty',
      'clean_procedure',
      'income_seizure',
      'external_duties',
      'duties_amount',
    ]
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get readonly() {
    return ['id']
  }

  user() {
    return this.belongsTo('App/Models/User', 'user_id', 'id')
  }
}

module.exports = Tenant
