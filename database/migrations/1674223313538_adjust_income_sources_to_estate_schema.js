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
const Estate = use('App/Models/Estate')

class AdjustIncomeSourcesToEstateSchema extends Schema {
  async up() {
    await Estate.query().update({
      income_sources: [
        INCOME_TYPE_EMPLOYEE,
        INCOME_TYPE_WORKER,
        INCOME_TYPE_UNEMPLOYED,
        INCOME_TYPE_CIVIL_SERVANT,
        INCOME_TYPE_FREELANCER,
        INCOME_TYPE_HOUSE_WORK,
        INCOME_TYPE_PENSIONER,
        INCOME_TYPE_SELF_EMPLOYED,
        INCOME_TYPE_TRAINEE,
      ],
    })
  }

  down() {}
}

module.exports = AdjustIncomeSourcesToEstateSchema
