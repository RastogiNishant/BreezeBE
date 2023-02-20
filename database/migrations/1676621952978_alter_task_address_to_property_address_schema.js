'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterTaskAddressToPropertyAddressSchema extends Schema {
  up() {
    this.alter('tasks', (table) => {
      // alter table
      table.renameColumn('address', 'property_address')
    })
  }

  down() {
    this.alter('estates', (table) => {
      // alter table
      table.integer('floor').unsigned().nullable().alter()
    })
  }
}

module.exports = AlterTaskAddressToPropertyAddressSchema
