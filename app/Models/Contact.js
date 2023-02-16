'use strict'

const Model = require('./BaseModel')

class Contact extends Model {
  static get columns() {
    return [
      'id',
      'user_id',
      'company_id',
      'full_name',
      'title',
      'email',
      'phone',
      'region',
      'avatar',
      'status',
    ]
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }
}

module.exports = Contact
