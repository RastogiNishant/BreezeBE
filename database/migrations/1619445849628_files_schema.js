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
  }

  down() {
    this.drop('files')
  }
}

module.exports = FilesSchema
