'use strict'

const Schema = use('Schema')
const {
  TIMESLOT_STATUS_BOOK,
  TIMESLOT_STATUS_CONFIRM,
  TIMESLOT_STATUS_REJECT,
  TIMESLOT_STATUS_DELAY,
  TIMESLOT_STATUS_COME,
} = require('../../app/constants')

class VisitSchema extends Schema {
  up() {
    this.alter('visits', (table) => {
      table.renameColumn('lord_status', 'lord_status_bak')
    })

    this.alter('visits', (table) => {
      table
        .enu('lord_status', [
          TIMESLOT_STATUS_BOOK,
          TIMESLOT_STATUS_CONFIRM,
          TIMESLOT_STATUS_REJECT,
          TIMESLOT_STATUS_DELAY,
          TIMESLOT_STATUS_COME,
        ])
        .defaultTo(TIMESLOT_STATUS_BOOK)
        .notNullable()
    })

    this.raw(`UPDATE visits set lord_status = lord_status_bak`)

    this.alter('visits', (table) => {
      table.dropColumn('lord_status_bak')
    })
  }

  down() {}
}

module.exports = VisitSchema
