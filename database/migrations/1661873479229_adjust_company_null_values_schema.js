'use strict'

const { COMPANY_TYPE_PRIVATE, COMPANY_SIZE_LARGE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Company = use('App/Models/Company')

class AdjustCompanyNullValuesSchema extends Schema {
  async up() {
    await Company.query().update({ type: COMPANY_TYPE_PRIVATE }).whereNull('type')
    await Company.query().update({ size: COMPANY_SIZE_LARGE }).whereNull('size')
  }

  down() {
  }
}

module.exports = AdjustCompanyNullValuesSchema
