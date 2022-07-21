'use strict'

const { LETTING_TYPE_VOID } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class UpdateNullLettingTypesSchema extends Schema {
  async up() {
    await Estate.query().update({ letting_type: LETTING_TYPE_VOID }).whereNull('letting_type')
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateNullLettingTypesSchema
