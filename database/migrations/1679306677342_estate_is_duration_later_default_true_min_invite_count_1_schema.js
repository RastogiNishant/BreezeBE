'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateIsDurationLaterDefaultTrueMinInviteCount1Schema extends Schema {
  up() {
    this.alter('estates', (table) => {
      // alter table
      table.boolean('is_duration_later').defaultTo(true).alter()
      table.integer('min_invite_count').defaultTo(1).alter()
    })
  }

  down() {
    this.alter('estates', (table) => {
      // alter table
      table.boolean('is_duration_later').defaultTo(false).alter()
      table.integer('min_invite_count').defaultTo(null).alter()
    })
  }
}

module.exports = EstateIsDurationLaterDefaultTrueMinInviteCount1Schema
