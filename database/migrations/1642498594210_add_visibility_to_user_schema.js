'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { IS_PRIVATE, IS_PUBLIC } = require('../../app/constants')

class AddVisibilityToUserSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.integer('prospect_visibility').unsigned().defaultTo(IS_PRIVATE)
      table.integer('lanlord_visibility').unsigned().defaultTo(IS_PRIVATE)
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('prospect_visibility')
      table.dropColumn('lanlord_visibility')
    })
  }
}

module.exports = AddVisibilityToUserSchema
