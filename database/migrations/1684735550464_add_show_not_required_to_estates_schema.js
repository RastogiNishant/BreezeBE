'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddShowNotRequiredToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table
        .boolean('is_not_show')
        .defaultTo(false)
        .comment('true means directly want to rent property to a prospect without showing stage')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('is_not_show')
    })
  }
}

module.exports = AddShowNotRequiredToEstatesSchema
