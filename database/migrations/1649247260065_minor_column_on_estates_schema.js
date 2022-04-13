'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MinorColumnOnEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      //null means no answer, true means yes, false means no matter
      table.boolean('minors').nullable().defaultTo(null)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('minors')
    })
  }
}

module.exports = MinorColumnOnEstatesSchema
