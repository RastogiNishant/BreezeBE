'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstateOtherSchema extends Schema {
  up () {
    this.table('estates', (table) => {
      // alter table
      table.text('others')
    })
  }

  down () {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstateOtherSchema
