'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MakeReceiverNullableOnChatsSchema extends Schema {
  up() {
    this.table('chats', (table) => {
      table.integer('receiver_id').nullable().alter()
    })
  }

  down() {
    this.table('chats', (table) => {
      // reverse alternations - will cause error don't uncomment
      //table.integer('receiver_id').notNullable().alter()
    })
  }
}

module.exports = MakeReceiverNullableOnChatsSchema
