'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCommentsToNotesSchema extends Schema {
  up() {
    this.table('notes', (table) => {
      table.integer('writer_id').unsigned().comment(`this is the landlord's user_id`).alter()
      table.integer('about_id').unsigned().comment(`this is the tenant's user_id`).alter()
    })
  }

  down() {
    this.table('notes', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddCommentsToNotesSchema
