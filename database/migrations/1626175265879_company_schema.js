'use strict'

const Schema = use('Schema')

class CompanySchema extends Schema {
  up() {
    this.table('companies', (table) => {
      table.string('avatar', 512)
    })
  }

  down() {
    this.table('companies', (table) => {
      table.dropColumn('avatar')
    })
  }
}

module.exports = CompanySchema
