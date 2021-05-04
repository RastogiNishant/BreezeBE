'use strict'

const Schema = use('Schema')

class EstatesSchema extends Schema {
  up() {
    this.alter('estates', (table) => {
      table.integer('household_type').unsigned().alter()
    })
  }

  down() {}
}

module.exports = EstatesSchema
