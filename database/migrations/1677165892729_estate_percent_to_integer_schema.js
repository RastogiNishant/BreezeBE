'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstatePercentToIntegerSchema extends Schema {
  up() {
    this.alter('estates', (table) => {
      // alter table
      table.integer('percent').unsigned().alter()
    })
  }

  down() {
    this.alter('estates', (table) => {
      // alter table
      table.decimal('percent').alter()
    })
  }
}

module.exports = EstatePercentToIntegerSchema
