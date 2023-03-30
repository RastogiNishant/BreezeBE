'use strict'

const { IMPORT_ACTIVITY_DONE, IMPORT_ACTION_IMPORT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Import = use('App/Models/Import')
class ImportStatusToDoneSchema extends Schema {
  async up() {
    await Import.query()
      .where('action', IMPORT_ACTION_IMPORT)
      .update({ status: IMPORT_ACTIVITY_DONE })
  }

  down() {}
}

module.exports = ImportStatusToDoneSchema
