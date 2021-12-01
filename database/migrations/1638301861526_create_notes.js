'use strict'

const Schema = use('Schema')

class BuddySchema extends Schema {
  up() {
    this.create('notes', (table) => {
      table.increments()
      table.string('note', 3000)
      table.integer('writer_id').unsigned().index()
      table.foreign('writer_id').references('id').on('users').onDelete('cascade')
      table.integer('about_id').unsigned().index()
      table.foreign('about_id').references('id').on('users').onDelete('cascade')
      table.timestamps()
    })
  }

  down() {
    console.log(__filename)
    this.drop('notes')
  }
}

module.exports = BuddySchema
