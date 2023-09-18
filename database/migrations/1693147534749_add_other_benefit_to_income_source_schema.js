'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const {
  HIRING_TYPE_FULL_TIME,
  HIRING_TYPE_PART_TIME,
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
  INCOME_TYPE_OTHER_BENEFIT,
} = require('../../app/constants')

class AddOtherBenefitToIncomeSourceSchema extends Schema {
  async up() {
    await Database.raw('ALTER TABLE incomes DROP CONSTRAINT IF EXISTS incomes_income_type_check;')
    await Database.raw(
      `ALTER TABLE incomes ADD CONSTRAINT incomes_income_type_check check (income_type in ('${INCOME_TYPE_EMPLOYEE}', '${INCOME_TYPE_WORKER}','${INCOME_TYPE_UNEMPLOYED}','${INCOME_TYPE_CIVIL_SERVANT}','${INCOME_TYPE_FREELANCER}','${INCOME_TYPE_HOUSE_WORK}','${INCOME_TYPE_PENSIONER}','${INCOME_TYPE_SELF_EMPLOYED}','${INCOME_TYPE_TRAINEE}', '${INCOME_TYPE_OTHER_BENEFIT}'));;`
    )
  }

  down() {}
}

module.exports = AddOtherBenefitToIncomeSourceSchema
