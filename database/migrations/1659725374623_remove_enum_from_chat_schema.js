'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class RemoveEnumFromChatSchema extends Schema {
  async up () {
    await Database.raw("ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_type_check;")
    await Database.raw("ALTER TABLE chats ADD CONSTRAINT chats_type_check check (type in ('message', 'notification', 'last-read-marker','chatbot'));;")
  }

  down () {
    this.table('remove_enum_from_chats', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RemoveEnumFromChatSchema
