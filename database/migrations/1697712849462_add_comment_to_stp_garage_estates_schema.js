'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCommentToStpGarageEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.decimal('stp_garage').defaultTo(0).comment('Parking Rent').alter()
      table.decimal('additional_costs').defaultTo(0).comment('Utility Costs').alter()
      table.decimal('rooms_number', 3, 1).defaultTo(1).comment('Number of Rooms').alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCommentToStpGarageEstatesSchema
