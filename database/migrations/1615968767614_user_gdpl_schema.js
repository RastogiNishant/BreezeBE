'use strict'

const Schema = use('Schema')

class UserGdplSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.integer('terms_id').unsigned().references('id').inTable('terms')
      table.integer('agreements_id').unsigned().references('id').inTable('agreements')
      table.integer('company_id').unsigned().references('id').inTable('companies')
      table.string('ldin_id', 100)
      table.string('ldin_token', 254)
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('terms_id')
      table.dropColumn('agreements_id')
      table.dropColumn('company_id')
      table.dropColumn('ldin_id')
      table.dropColumn('ldin_token')
    })
  }
}

module.exports = UserGdplSchema
