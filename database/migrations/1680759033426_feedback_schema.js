'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FeedbackSchema extends Schema {
  up() {
    this.create('feedbacks', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.integer('point').unsigned()
      table.string('description', 1024)
      table.string('device')
      table.timestamps()
      table.index('user_id')
    })
  }

  down() {
    this.drop('feedbacks')
  }
}

module.exports = FeedbackSchema
