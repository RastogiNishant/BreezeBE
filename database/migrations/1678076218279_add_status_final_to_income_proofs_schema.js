'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddStatusFinalToIncomeProofsSchema extends Schema {
  up() {
    this.table('income_proofs', (table) => {
      // alter table
      table.integer('status').defaultTo(STATUS_ACTIVE)
    })
  }

  down() {
    this.table('income_proofs', (table) => {
      // reverse alternations
      table.integer('status').defaultTo(STATUS_ACTIVE)
    })
  }
}

module.exports = AddStatusFinalToIncomeProofsSchema
