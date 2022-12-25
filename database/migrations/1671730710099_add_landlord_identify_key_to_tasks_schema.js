'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddLandlordIdentifyKeyToTasksSchema extends Schema {
  up() {
    this.table('tasks', (table) => {
      table.string('email', 255).nullable()
      table.string('address', 255).nullable()
      table.string('address_detail', 255).nullable()
      table.string('landlord_identify_key', 32).nullable()
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
      table.dropColumn('email')
      table.dropColumn('address')
      table.dropColumn('address_detail')
      table.dropColumn('landlord_identify_key')
    })
  }
}

module.exports = AddLandlordIdentifyKeyToTasksSchema
