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
      'major_income',
      'extra_income',
    ]
  }

  static get readonly() {
    return ['id', 'member_id']
  }

  static get hidden() {
    return ['document']
  }

  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Income
