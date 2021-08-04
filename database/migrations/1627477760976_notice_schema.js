'use strict'

const Schema = use('Schema')
const {
  TIMESLOT_STATUS_BOOK,
  TIMESLOT_STATUS_PRE_CONFIRM,
  TIMESLOT_STATUS_CONFIRM,
  TIMESLOT_STATUS_REJECT,
  TIMESLOT_STATUS_DELAY,
} = require('../../app/constants')

class NoticeSchema extends Schema {
  up() {
    this.create('notices', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.integer('type').unsigned()
      table.json('data')
      table.timestamps()
    })

    this.table('visits', (table) => {
      table
        .enum('tenant_status', [
          TIMESLOT_STATUS_BOOK,
          TIMESLOT_STATUS_PRE_CONFIRM,
          TIMESLOT_STATUS_CONFIRM,
          TIMESLOT_STATUS_REJECT,
          TIMESLOT_STATUS_DELAY,
        ])
        .defaultTo(TIMESLOT_STATUS_BOOK)
      table.integer('tenant_delay').unsigned().defaultTo(0)
      table
        .enum('lord_status', [
          TIMESLOT_STATUS_BOOK,
          TIMESLOT_STATUS_CONFIRM,
          TIMESLOT_STATUS_REJECT,
          TIMESLOT_STATUS_DELAY,
        ])
        .defaultTo(TIMESLOT_STATUS_BOOK)
      table.integer('lord_delay').unsigned().defaultTo(0)
    })

    this.alter('rooms', (table) => {
      table.dropForeign('estate_id')
    })

    this.alter('rooms', (table) => {
      table
        .integer('estate_id')
        .unsigned()
        .references('id')
        .inTable('estates')
        .onDelete('cascade')
        .alter()
    })
  }

  down() {
    this.drop('notices')
    this.table('visits', (table) => {
      table.dropColumn('tenant_status')
      table.dropColumn('tenant_delay')
      table.dropColumn('lord_status')
      table.dropColumn('lord_delay')
    })
  }
}

module.exports = NoticeSchema
