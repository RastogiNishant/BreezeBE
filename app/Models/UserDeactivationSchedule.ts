'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
import * as Model from './BaseModel'

class UserDeactivationSchedule extends Model {
  static get columns (): string[] {
    return ['user_id', 'deactivate_schedule', 'created_at', 'updated_at', 'type']
  }

  static user (): void {
    super.belongsTo('User', 'user_id', 'id')
  }
}

module.exports = UserDeactivationSchedule
