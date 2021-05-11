'use strict'

const Model = require('./BaseModel')

class TimeSlot extends Model {
  static get columns() {
    return ['id', 'estate_id', 'week_day', 'start_at', 'end_at', 'slot_length']
  }

  /**
   *
   */
  static get traits() {
    return ['NoTimestamp']
  }

  /**
   *
   */
  static get readonly() {
    return ['id', 'estate_id']
  }

  /**
   *
   */
  user() {
    return this.belongsTo('App/Models/Estate', 'estate_id', 'id')
  }
}

module.exports = TimeSlot
