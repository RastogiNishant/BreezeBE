'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameCertCategorySchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.renameColumn('cert_category', 'cert_category_2')
    })
  }

  down() {}
}

module.exports = RenameCertCategorySchema
