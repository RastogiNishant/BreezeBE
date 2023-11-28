'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddProfileStatusToMatchSchema extends Schema {
  up () {
    this.table('matches', (table) => {
      table.integer('profile_status').unsigned().defaultTo(0)
    })
  }

  down () {
    this.table('matches', (table) => {
      table.dropColumn('profile_status')
    })
  }
}

module.exports = AddProfileStatusToMatchSchema
