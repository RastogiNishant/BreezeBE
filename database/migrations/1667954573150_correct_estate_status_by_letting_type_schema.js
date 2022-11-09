'use strict'

const { STATUS_DRAFT, LETTING_TYPE_LET, STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class CorrectEstateStatusByLettingTypeSchema extends Schema {
  up() {
    this.table('estates', async () => {
      await Estate.query()
        .update({ status: STATUS_DRAFT })
        .whereNotIn('status', [STATUS_DRAFT, STATUS_DELETE])
        .where('letting_type', LETTING_TYPE_LET)
    })
  }

  down() {
    this.table('estates', () => {
      // reverse alternations
    })
  }
}

module.exports = CorrectEstateStatusByLettingTypeSchema
