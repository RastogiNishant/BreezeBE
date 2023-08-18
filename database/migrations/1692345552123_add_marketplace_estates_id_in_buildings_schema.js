'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMarketplaceEstatesIdInBuildingsSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table
        .specificType('marketplace_estate_ids', 'INT[]')
        .comment('which properties are published to marketplace')
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddMarketplaceEstatesIdInBuildingsSchema
