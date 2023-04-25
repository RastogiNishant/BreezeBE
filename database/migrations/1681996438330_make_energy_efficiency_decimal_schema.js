'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeEnergyEfficiencyDecimalSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.decimal('energy_efficiency').alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MakeEnergyEfficiencyDecimalSchema
