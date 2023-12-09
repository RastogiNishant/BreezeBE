'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContactRequestMessagesSchema extends Schema {
  up() {
    this.create('contact_request_messages', (table) => {
      table.increments()
      table
        .integer('contact_request_id')
        .unsigned()
        .references('id')
        .inTable('estate_sync_contact_requests')
        .notNullable()
        .onDelete('cascade')
        .index()
      table.string('message', 1000)
      table.timestamps()
    })
  }

  down() {
    this.drop('contact_request_messages')
  }
}

module.exports = ContactRequestMessagesSchema
