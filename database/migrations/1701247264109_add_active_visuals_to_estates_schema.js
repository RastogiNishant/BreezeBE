'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddActiveVisualsToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.integer('active_visuals').nullable()
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('active_visuals')
    })
  }
}

module.exports = AddActiveVisualsToEstatesSchema
