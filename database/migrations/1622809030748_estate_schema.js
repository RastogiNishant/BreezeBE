'use strict'

const Schema = use('Schema')

class EstateSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('avail_duration').unsigned()
      table.datetime('vacant_date', { useTz: false })
      table.dropColumn('available_date')
    })

    this.table('estates', (table) => {
      table.datetime('available_date', { useTz: false })
    })

    this.table('time_slots', (table) => {
      table.dropColumn('start_at')
      table.dropColumn('end_at')
    })

    this.table('time_slots', (table) => {
      table.datetime('start_at', { useTz: false })
      table.datetime('end_at', { useTz: false })
      table.dropColumn('week_day')
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('avail_duration')
      table.dropColumn('vacant_date')
    })

    this.table('time_slots', (table) => {
      table.dropColumn('start_at')
      table.dropColumn('end_at')
    })

    this.table('time_slots', (table) => {
      table.time('start_at', { useTz: false })
      table.time('end_at', { useTz: false })
      table.integer('week_day').unsigned()
    })
  }
}

module.exports = EstateSchema
