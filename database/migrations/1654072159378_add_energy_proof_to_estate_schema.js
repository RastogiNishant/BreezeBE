'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEnergyProofToEstateSchema extends Schema {
  up () {
    this.table('estates', (table) => {
      // alter table
      table.string('energy_proof', 255)
    })
  }

  down () {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('energy_proof')
    })
  }
}

module.exports = AddEnergyProofToEstateSchema
