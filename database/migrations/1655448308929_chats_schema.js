'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
class ChatsSchema extends Schema {
  up () {
    this.create('chats', (table) => {
      table.increments()
      table.integer('task_id').unsigned().notNullable().references('id').inTable('tasks')
      table.integer('sender_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('receiver_id').unsigned().notNullable().references('id').inTable('users')      
      table.text('text')
      table.json('attachments')
      table.text('is_viewed')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('chats')
  }
}

module.exports = ChatsSchema
