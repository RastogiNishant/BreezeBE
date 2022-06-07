'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEnergyProofOriginalFileNameSchema extends Schema {
  up () {
    this.table('estates', (table) => {
      // alter table
      table.string('energy_proof_original_file', 255)      
    })
  }

  down () {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('energy_proof_original_file')
    })
  }
}

module.exports = AddEnergyProofOriginalFileNameSchema
