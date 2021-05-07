'use strict'

const Model = require('./BaseModel')

class Member extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'avatar',
      'firstname',
      'secondname',
      'child',
      'sex',
      'phone',
      'birthday',
      'email',
      'landlord_name',
      'landlord_phone',
      'landlord_email',
      'last_address',
      'rent_arrears_doc',
      'credit_score',
      'debt_proof',
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
  static get readonly() {
    return ['id', 'user_id']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/MemberSerializer'
  }

  /**
   *
   */
  incomes() {
    return this.hasMany('App/Models/Income')
  }
}

module.exports = Member
