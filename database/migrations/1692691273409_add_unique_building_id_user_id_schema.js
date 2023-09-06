'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUniqueBuildingIdUserIdSchema extends Schema {
  up() {
    this.table('buildings', (table) => {
      // alter table
      table.dropUnique('building_id')
      table.unique(['building_id', 'user_id'])
    })
  }

  down() {
    this.table('buildings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddUniqueBuildingIdUserIdSchema
