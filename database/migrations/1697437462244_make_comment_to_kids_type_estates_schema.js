'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeCommentToKidsTypeEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('kids_type').unsigned().comment('minor count').alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = MakeCommentToKidsTypeEstatesSchema
