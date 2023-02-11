'use strict'

const {
  FILE_TYPE_IMAGE,
  FILE_TYPE_EXTERNAL,
  FILE_TYPE_GALLERY,
  FILE_TYPE_UNASSIGNED,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const File = use('App/Models/File')
const Database = use('Database')

class FilesImageToExternalSchema extends Schema {
  async up() {
    await Database.raw('ALTER TABLE files DROP CONSTRAINT IF EXISTS files_type_check;')
    await File.query().where('type', FILE_TYPE_IMAGE).update({ type: FILE_TYPE_EXTERNAL })
    await File.query().where('type', FILE_TYPE_GALLERY).update({ type: FILE_TYPE_UNASSIGNED })
    await Database.raw(
      "ALTER TABLE files ADD CONSTRAINT files_type_check check (type in ('cover', 'plan', 'doc', 'custom', 'external', 'unassigned'));;"
    )
  }

  async down() {
    await Database.raw('ALTER TABLE files DROP CONSTRAINT IF EXISTS files_type_check;')
    await File.query().where('type', FILE_TYPE_EXTERNAL).update({ type: FILE_TYPE_IMAGE })
    await File.query().where('type', FILE_TYPE_UNASSIGNED).update({ type: FILE_TYPE_GALLERY })
    await Database.raw(
      "ALTER TABLE files ADD CONSTRAINT files_type_check check (type in ('cover', 'plan', 'doc', 'custom', 'image', 'gallery'));;"
    )
  }
}

module.exports = FilesImageToExternalSchema
