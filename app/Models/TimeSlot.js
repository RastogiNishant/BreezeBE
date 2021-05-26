'use strict'

const moment = require('moment')
const { range } = require('lodash')

const AppException = use('App/Exceptions/AppException')
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

  /**
   * Check is date pass to slot
   */
  isMatch(date) {
    // Invalid week day
    if (date.weekday() !== this.week_day) {
      return false
    }
    if (!this.start_at || !this.end_at || !this.slot_length) {
      throw new AppException('Slot data is not completely filled')
    }

    const startAtTimestamp = moment.utc(`1970-01-01 ${this.start_at}`).toDate().getTime()
    const endAtTimestamp = moment.utc(`1970-01-01 ${this.end_at}`).toDate().getTime()
    const slotTimestamp = moment.utc(date.format(`1970-01-01 HH:mm`)).toDate().getTime()

    // Slot is not range
    if (slotTimestamp < startAtTimestamp || slotTimestamp > endAtTimestamp) {
      return false
    }

    // Get all available slots
    const slots = range(
      Math.min(startAtTimestamp, endAtTimestamp),
      Math.max(startAtTimestamp, endAtTimestamp),
      this.slot_length * 60 * 1000
    )

    return slots.includes(slotTimestamp)
  }
}

module.exports = TimeSlot
