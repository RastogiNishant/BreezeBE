'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TasksEstateIdNullableSchema extends Schema {
  up() {
    this.alter('tasks', (table) => {
      table.integer('estate_id').unsigned().nullable().alter()
    })

    this.alter('chats', (table) => {
      table.integer('sender_id').unsigned().nullable().alter()
    })
  }

  down() {
    this.table('tasks', (table) => {
      // reverse alternations
    })
  }
}

module.exports = TasksEstateIdNullableSchema
