'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RemoveCertCategory2EstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.dropColumn('cert_category_2')
    })
  }

  down() {}
}

module.exports = RemoveCertCategory2EstatesSchema
