'use strict'

const { INCOME_NORMAL_TYPE, INCOME_EXTRA_TYPE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddTypeToIncomeProofSchema extends Schema {
  up() {
    this.table('income_proofs', (table) => {
      // alter table
      table.enum('type', [INCOME_NORMAL_TYPE, INCOME_EXTRA_TYPE]).defaultTo(INCOME_NORMAL_TYPE)
    })
  }

  down() {
    this.table('income_proofs', (table) => {
      table.dropColumn('type')
    })
  }
}

module.exports = AddTypeToIncomeProofSchema
