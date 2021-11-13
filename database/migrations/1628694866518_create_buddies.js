'use strict'

const Schema = use('Schema')

class BuddySchema extends Schema {
  up() {
    this.create('buddies', (table) => {
      table.increments()
      table.string('name', 30)
      table.string('phone', 30)
      table.string('email', 30)
      table.integer('user_id').unsigned().index()
      table.foreign('user_id').references('id').on('users').onDelete('cascade')
      table.timestamps()
    })
  }

  down() {
    console.log(__filename)
    this.drop('buddies')
  }
}

module.exports = BuddySchema
