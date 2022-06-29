'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class Task extends Model {
  static get columns() {
    return ['estate_id', 'tenant_id', 'urgency', 'status', 'creator_role', 'attachments']
  }

  chats() {
    return this.hasMany('App/Models/Chat', 'id', 'task_id')
  }
}
module.exports = Task
