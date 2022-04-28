'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddExtraAddressSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.string('extra_address', 255).nullable()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('extra_address')
    })
  }
}

module.exports = AddExtraAddressSchema
