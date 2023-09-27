'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddMatchSettingsToUser extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.boolean('show_proofs_of_paid_rent_from_former_landlords', 255).defaultTo(true)
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('show_proofs_of_paid_rent_from_former_landlords')
    })
  }
}

module.exports = AddMatchSettingsToUser
