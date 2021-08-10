'use strict'

const Schema = use('Schema')

class VisitsSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      table.unique(['estate_id', 'user_id'])
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
    })
  }
}

module.exports = VisitsSchema
