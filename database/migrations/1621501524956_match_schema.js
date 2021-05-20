'use strict'

const Schema = use('Schema')

const { MATCH_STATUS_NEW } = require('../../app/constants')

class MatchSchema extends Schema {
  up() {
    this.create('matches', (table) => {
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
        .onDelete('cascade')
      table
        .integer('estate_id')
        .unsigned()
        .references('id')
        .inTable('estates')
        .notNullable()
        .onDelete('cascade')
      table.integer('status').unsigned().defaultTo(MATCH_STATUS_NEW)
      table.decimal('percent', 5, 2).notNullable()

      table.unique(['user_id', 'estate_id'])
    })
  }

  down() {
    this.drop('matches')
  }
}

module.exports = MatchSchema
