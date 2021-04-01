'use strict'

const Schema = use('Schema')

class UserGdplSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.integer('terms_id').unsigned().references('id').inTable('terms')
      table.integer('agreements_id').unsigned().references('id').inTable('agreements')
      table.integer('company_id').unsigned().references('id').inTable('companies')
      table.string('google_id', 32)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('terms_id')
      table.dropColumn('agreements_id')
      table.dropColumn('company_id')
      table.dropColumn('google_id')
    })
  }
}

module.exports = UserGdplSchema
