'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const {
  COMPANY_TYPE_PRIVATE,
  COMPANY_TYPE_PROPERTY_MANAGER,
  COMPANY_TYPE_PRIVATE_HOUSING,
  COMPANY_TYPE_MUNICIPAL_HOUSING,
  COMPANY_TYPE_HOUSING_COOPERATIVE,
  COMPANY_TYPE_LISTED_HOUSING,
  COMPANY_TYPE_BROKER,
} = require('../../app/constants')

class AddCompanyTypeBrokerToCompaniesSchema extends Schema {
  async up() {
    await Database.raw(`ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_type_check;`)
    await Database.raw(`ALTER TABLE companies ADD CONSTRAINT companies_type_check check 
      (type in ('${COMPANY_TYPE_PRIVATE}', '${COMPANY_TYPE_PROPERTY_MANAGER}',
      '${COMPANY_TYPE_PRIVATE_HOUSING}', '${COMPANY_TYPE_MUNICIPAL_HOUSING}', '${COMPANY_TYPE_HOUSING_COOPERATIVE}',
      '${COMPANY_TYPE_LISTED_HOUSING}', '${COMPANY_TYPE_BROKER}'));`)
  }

  down() {
    this.table('companies', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCompanyTypeBrokerToCompaniesSchema
