'use strict'

const Model = require('./BaseModel')

class MemberPermission extends Model {
  static get columns() {
    return [
      'id',
      'member_id',
      'user_id',
    ]
  }

  /**
   *
   */
   static get traits() {
    return ['NoTimestamp']
  }  
}

module.exports = MemberPermission
