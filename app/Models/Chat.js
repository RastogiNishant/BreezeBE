'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class Chat extends Model {
  static get columns() {
    return [
      'id',
      'task_id',
      'sender_id',
      'receiver_id',
      'text',
      'attachments',
      'is_viewed',
      'created_at',
      'updated_at',
    ]
  }

  sourceUser() {
    return this.belongsTo('App/Model/User', 'sender_id', 'id')
  }

  task() {
    return this.belongsTo('App/Models/Task', 'task_id', 'id')
  }
}

module.exports = Chat
