'use strict'

const {
  STATUS_ACTIVE,
  MEMBER_FILE_TYPE_PASSPORT,
  MEMBER_FILE_EXTRA_RENT_ARREARS_DOC,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  MEMBER_FILE_TYPE_EXTRA_PASSPORT,
} = require('../constants')
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
      'bio',
      'birthday',
      'email',
      'landlord_name',
      'landlord_phone',
      'landlord_email',
      'last_address',
      'rent_arrears_doc',
      'credit_score',
      'credit_score_submit_later',
      'debt_proof',
      'unpaid_rental',
      'insolvency_proceed',
      'clean_procedure',
      'income_seizure',
      'external_duties',
      'duties_amount',
      'execution',
      'code',
      'published_at',
      'is_verified',
      'owner_id',
      'owner_user_id',
      'phone_verified',
    ]
  }

  /**
   *
   */
  static get readonly() {
    return ['id']
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
    return this.hasMany('App/Models/Income').where('status', STATUS_ACTIVE)
  }

  final_incomes() {
    return this.hasMany('App/Models/Income').where('is_final', true)    
  }

  passports() {
    return this.hasMany('App/Models/MemberFile')
      .where('type', MEMBER_FILE_TYPE_PASSPORT)
      .where('status', STATUS_ACTIVE)
  }

  extra_passports() {
    return this.hasMany('App/Models/MemberFile')
      .where('type', MEMBER_FILE_TYPE_EXTRA_PASSPORT)
      .where('status', STATUS_ACTIVE)
  }

  extra_residency_proofs() {
    return this.hasMany('App/Models/MemberFile')
      .where('type', MEMBER_FILE_TYPE_EXTRA_RENT)
      .where('status', STATUS_ACTIVE)
  }

  extra_score_proofs() {
    return this.hasMany('App/Models/MemberFile')
      .where('type', MEMBER_FILE_TYPE_EXTRA_DEBT)
      .where('status', STATUS_ACTIVE)
  }

  static get limitFieldsList() {
    return [
      'id',
      'user_id',
      'firstname',
      'secondname',
      'child',
      'email',
      'birthday',
      'sex',
      'avatar',
      'share',
      'published_at',
      'is_verified',
      'owner_id',
      'owner_user_id',
      'phone_verified',
    ]
  }
}

module.exports = Member
