'use strict'

const Schema = use('Schema')

class TenantSchema extends Schema {
  up() {
    this.table('tenants', (table) => {
      table.dropColumn('commercial_use')
      table.boolean('private_use').defaultTo(false)
    })

    this.create('time_slots', (table) => {
      table.increments()
      table
        .integer('estate_id')
        .unsigned()
        .references('id')
        .inTable('estates')
        .notNullable()
        .onDelete('cascade')
      table.integer('week_day').unsigned()
      table.time('start_at')
      table.time('end_at')
      table.integer('slot_length').unsigned()
    })
  }

  down() {
    this.table('tenants', (table) => {
      table.dropColumn('private_use')
      table.boolean('commercial_use').defaultTo(false)
    })

    this.drop('time_slots')
  }
}

module.exports = TenantSchema
