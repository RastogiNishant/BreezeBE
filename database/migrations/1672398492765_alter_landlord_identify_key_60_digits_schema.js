'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterLandlordIdentifyKey60DigitsSchema extends Schema {
  up() {
    this.alter('tasks', (table) => {
      table.string('landlord_identify_key', 60).nullable().alter()
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterLandlordIdentifyKey60DigitsSchema
