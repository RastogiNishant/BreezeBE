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
