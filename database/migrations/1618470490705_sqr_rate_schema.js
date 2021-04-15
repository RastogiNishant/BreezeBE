'use strict'

const Schema = use('Schema')

class SqrRateSchema extends Schema {
  up () {
    this.create('sqr_rates', (table) => {
      table.increments()
      table.string('quality', 10)
      table.decimal('min_rate', 5, 2)
      table.decimal('max_rate', 5, 2)
      table.integer('min_year')
      table.integer('max_year')
      table.integer('min_sqr').defaultTo(0)
      table.integer('max_sqr')
    })
  }

  down () {
    this.drop('sqr_rates')
  }
}

module.exports = SqrRateSchema
