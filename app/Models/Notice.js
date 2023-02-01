'use strict'

const Model = require('./BaseModel')

class Notice extends Model {
  static get columns() {
    return ['id', 'user_id', 'estate_id', 'type', 'data']
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'user_id', 'type']
  }

  /**
   *
   */
  static get Serializer() {
    return 'App/Serializers/NoticeSerializer'
  }
}

module.exports = Notice
