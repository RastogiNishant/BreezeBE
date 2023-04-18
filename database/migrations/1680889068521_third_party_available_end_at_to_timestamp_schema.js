'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyAvailableEndAtToTimestampSchema extends Schema {
  up() {
    this.alter('third_party_offers', (table) => {
      // alter table
      table.dateTime('vacant_date').alter()
      table.dateTime('available_end_at').alter()
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ThirdPartyAvailableEndAtToTimestampSchema
