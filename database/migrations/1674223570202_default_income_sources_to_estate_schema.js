'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const {
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
} = require('../../app/constants')
class DefaultIncomeSourcesToEstateSchema extends Schema {
  up() {
    this.alter('estates', (table) => {
      // alter table
      table
        .specificType('income_sources', 'character varying(50)[]')
        .defaultTo(
          `{"${INCOME_TYPE_EMPLOYEE}","${INCOME_TYPE_WORKER}","${INCOME_TYPE_UNEMPLOYED}","${INCOME_TYPE_CIVIL_SERVANT}","${INCOME_TYPE_FREELANCER}","${INCOME_TYPE_HOUSE_WORK}","${INCOME_TYPE_PENSIONER}","${INCOME_TYPE_SELF_EMPLOYED}","${INCOME_TYPE_TRAINEE}"}`
        )
        .alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = DefaultIncomeSourcesToEstateSchema
