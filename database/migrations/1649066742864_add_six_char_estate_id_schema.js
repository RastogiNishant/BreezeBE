'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddSixCharEstateIdSchema extends Schema {
  async up() {
    await this.table('estates', (table) => {
      // alter table
      table.string('six_char_code', 6).nullable().unique()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('six_char_code')
    })
  }
}

module.exports = AddSixCharEstateIdSchema
