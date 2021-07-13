'use strict'

const Schema = use('Schema')
const { COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE } = require('../../app/constants')

class CompaniesSchema extends Schema {
  up() {
    this.table('companies', (table) => {
      table.enum('size', [COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE])
    })
  }

  down() {
    this.table('companies', (table) => {
      table.dropColumn('size')
    })
  }
}

module.exports = CompaniesSchema
