'use strict'

const { IMPORT_ACTIVITY_DONE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Import = use('App/Models/Import')
class AdjustStatusToChangedForImportsSchema extends Schema {
  async up() {
    await Import.query().update({ status: IMPORT_ACTIVITY_DONE })
  }

  down() {}
}

module.exports = AdjustStatusToChangedForImportsSchema
