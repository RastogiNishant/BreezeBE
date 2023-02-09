'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFileFormatToFilesSchema extends Schema {
  up() {
    this.table('files', (table) => {
      table.string('file_format', 100)
    })
  }

  down() {
    this.table('files', (table) => {
      table.dropColumn('file_format')
    })
  }
}

module.exports = AddFileFormatToFilesSchema
