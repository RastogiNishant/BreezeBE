'use strict'

const Schema = use('Schema')
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
} = require('../../app/constants')

class NewIncomeTypes extends Schema {
  up() {
    this.raw(`
      ALTER TABLE incomes
      DROP CONSTRAINT "incomes_income_type_check",
      ADD CONSTRAINT "incomes_income_type_check"
      CHECK (income_type IN ('private', 'pension', 'student', '${INCOME_TYPE_EMPLOYEE}', '${INCOME_TYPE_WORKER}','${INCOME_TYPE_UNEMPLOYED}','${INCOME_TYPE_CIVIL_SERVANT}','${INCOME_TYPE_FREELANCER}','${INCOME_TYPE_HOUSE_WORK}','${INCOME_TYPE_PENSIONER}','${INCOME_TYPE_SELF_EMPLOYED}','${INCOME_TYPE_TRAINEE}'))
    `)

    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_PENSIONER}' WHERE income_type = 'private'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_PENSIONER}' WHERE income_type = 'pension'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_TRAINEE}' WHERE income_type = 'student'`
    )

    this.raw(`
      ALTER TABLE incomes
      DROP CONSTRAINT "incomes_income_type_check",
      ADD CONSTRAINT "incomes_income_type_check"
      CHECK (income_type IN ('${INCOME_TYPE_EMPLOYEE}', '${INCOME_TYPE_WORKER}','${INCOME_TYPE_UNEMPLOYED}','${INCOME_TYPE_CIVIL_SERVANT}','${INCOME_TYPE_FREELANCER}','${INCOME_TYPE_HOUSE_WORK}','${INCOME_TYPE_PENSIONER}','${INCOME_TYPE_SELF_EMPLOYED}','${INCOME_TYPE_TRAINEE}'))
    `)
  }

  down() {
    this.raw(`
      ALTER TABLE incomes
      DROP CONSTRAINT "incomes_income_type_check",
      ADD CONSTRAINT "incomes_income_type_check"
      CHECK (income_type IN ('private', 'pension', 'student', '${INCOME_TYPE_EMPLOYEE}', '${INCOME_TYPE_WORKER}','${INCOME_TYPE_UNEMPLOYED}','${INCOME_TYPE_CIVIL_SERVANT}','${INCOME_TYPE_FREELANCER}','${INCOME_TYPE_HOUSE_WORK}','${INCOME_TYPE_PENSIONER}','${INCOME_TYPE_SELF_EMPLOYED}','${INCOME_TYPE_TRAINEE}'))
    `)

    this.raw(
      `UPDATE incomes SET income_type = 'pension' WHERE income_type = '${INCOME_TYPE_PENSIONER}'`
    )
    this.raw(
      `UPDATE incomes SET income_type = 'student' WHERE income_type = '${INCOME_TYPE_TRAINEE}'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_EMPLOYEE}' WHERE income_type = '${INCOME_TYPE_CIVIL_SERVANT}'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_EMPLOYEE}' WHERE income_type = '${INCOME_TYPE_FREELANCER}'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_EMPLOYEE}' WHERE income_type = '${INCOME_TYPE_HOUSE_WORK}'`
    )
    this.raw(
      `UPDATE incomes SET income_type = '${INCOME_TYPE_EMPLOYEE}' WHERE income_type = '${INCOME_TYPE_WORKER}'`
    )

    this.raw(`
      ALTER TABLE incomes
      DROP CONSTRAINT "incomes_income_type_check",
      ADD CONSTRAINT "incomes_income_type_check"
      CHECK (income_type IN ('pension', 'private', 'student', '${INCOME_TYPE_EMPLOYEE}','${INCOME_TYPE_UNEMPLOYED}', '${INCOME_TYPE_SELF_EMPLOYED}'))
    `)
  }
}

module.exports = NewIncomeTypes
