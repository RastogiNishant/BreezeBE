'use strict'

const Model = require('./BaseModel')

class Income extends Model {
  static get columns() {
    return [
      'id',
      'member_id',
      'document',
      'company_logo',
      'profession',
      'position',
      'hiring_date',
      'employment_type',
      'income',
      'company',
      'work_exp',
      'income_type',
      'status',
      'is_final',
    ]
  }

  static get readonly() {
    return ['id', 'member_id', 'income_type']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/IncomeSerializer'
  }

  static get hidden() {
    return ['document']
  }

  static get traits() {
    return ['NoTimestamp']
  }

  proofs() {
    return this.hasMany('App/Models/IncomeProof').where('status', STATUS_ACTIVE)
  }

  member() {
    return this.belongsTo('App/Models/Member', 'member_id', 'id')
  }
}

module.exports = Income
