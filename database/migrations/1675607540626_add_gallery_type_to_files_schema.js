'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddGalleryTypeToFilesSchema extends Schema {
  async up() {
    await Database.raw('ALTER TABLE files DROP CONSTRAINT IF EXISTS files_type_check;')
    await Database.raw(
      "ALTER TABLE files ADD CONSTRAINT files_type_check check (type in ('cover', 'plan', 'doc', 'image', 'custom','gallery'));;"
    )
  }

  down() {}
}

module.exports = AddGalleryTypeToFilesSchema
