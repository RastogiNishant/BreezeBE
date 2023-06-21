'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEnergyCertificateDecimalSchema extends Schema {
  up() {
    this.alter('estates', (table) => {
      // alter table
      table.decimal('energy_efficiency').alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('energy_efficiency')
    })
  }
}

module.exports = AddEnergyCertificateDecimalSchema
