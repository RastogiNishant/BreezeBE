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
    this.table('incomes', (table) => {
      table
        .enum('income_type', [
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
        ])
        .alter()
    })
  }

  down() {
    this.table('incomes', (table) => {
      table.dropColumn('income_type')
    })
  }
}

module.exports = NewIncomeTypes
