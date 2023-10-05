'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeCertCategoryArrayEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.specificType('cert_category', 'text[]')
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('cert_category')
    })
  }
}

module.exports = MakeCertCategoryArrayEstatesSchema
