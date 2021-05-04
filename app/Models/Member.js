'use strict'

const Model = require('./BaseModel')

class Member extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'child',
      'firstname',
      'secondname',
      'phone',
      'birthday',
      'sex',
      'avatar',
      'profession',
      'company_logo',
      'hiring_date',
      'employment_type',
      'major_income',
      'extra_income',
    ]
  }

  static get readonly() {
    return ['id', 'user_id']
  }

  incomes() {
    return this.hasMany('App/Models/Income')
  }
}

module.exports = Member
