'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = require('./BaseModel')

class UserDeactivationSchedule extends Model {
  static get columns() {
    return ['user_id', 'deactivate_schedule', 'created_at', 'updated_at']
  }

  static user() {
    this.belongsTo('User', 'user_id', 'id')
  }
}

module.exports = UserDeactivationSchedule
