'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterCertCategoryTo100LengthSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.string('cert_category', 100).alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterCertCategoryTo100LengthSchema
