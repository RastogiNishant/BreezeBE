'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyFieldRenameSchema extends Schema {
  up() {
    this.alter('third_party_offers', (table) => {
      // alter table
      table.renameColumn('expiration_date', 'available_end_at')
    })
  }

  down() {
    this.alter('third_party_offers', (table) => {
      // reverse alternations
      table.renameColumn('available_end_at', 'expiration_date')
    })
  }
}

module.exports = ThirdPartyFieldRenameSchema
