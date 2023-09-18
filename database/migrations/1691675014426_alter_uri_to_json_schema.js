'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterUriToJsonSchema extends Schema {
  up() {
    this.table('tenant_certificates', (table) => {
      // alter table
      table.json('attachments').notNullable()
      table.dropColumn('uri')
      table.dropColumn('file_name')
      table.dropColumn('disk')
    })
  }

  down() {
    this.table('tenant_certificates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterUriToJsonSchema
