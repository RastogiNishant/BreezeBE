'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCertCategorySchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.string('cert_category', 10)
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('cert_category')
    })
  }
}

module.exports = AddCertCategorySchema
