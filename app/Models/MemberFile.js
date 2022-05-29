'use strict'

const Model = require('./BaseModel')

class MemberFile extends Model {
  static get columns() {
    return ['id', 'file', 'status', 'type', 'member_id']
  }

  member() {
    return this.belongsTo('App/Models/Member', 'member_id', 'id')
  }
}

module.exports = MemberFile
