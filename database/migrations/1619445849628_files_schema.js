'use strict'

const Schema = use('Schema')

class FilesSchema extends Schema {
  up() {
    this.create('files', (table) => {
      table.increments()
      table.string('url', 254)
      table.integer('estate_id').unsigned().references('id').inTable('estates').onDelete('cascade')
      table.enum('type', ['cover', 'plan', 'doc', 'image'])
      table.string('disk', 10)
    })
    this.table('estates', (table) => {
      table.dropColumn('plan')
    })
  }

  down() {
    this.drop('files')
    this.table('estates', (table) => {
      table.json('plan')
    })
  }
}

module.exports = FilesSchema
