'use strict'

const { MATCH_STATUS_NEW } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyMatchesSchema extends Schema {
  up() {
    this.create('third_party_matches', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('status').defaultTo(MATCH_STATUS_NEW)
      table.integer('estate_id').unsigned().references('id').inTable('third_party_offers')
      table.decimal('percent', 5, 2).notNullable()

      table.timestamps()
      table.index('user_id')
      table.index('estate_id')
    })
  }

  down() {
    this.drop('third_party_matches')
  }
}

module.exports = ThirdPartyMatchesSchema
