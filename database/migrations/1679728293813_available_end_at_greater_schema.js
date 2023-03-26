'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

class AvailableEndAtGreaterSchema extends Schema {
  async up() {
    await Database.raw(
      `update estates set available_end_at = ( available_start_at + INTERVAL '1 day') where available_end_at is not null and available_start_at is not null and available_start_at >= available_end_at `
    )
  }

  down() {}
}

module.exports = AvailableEndAtGreaterSchema
