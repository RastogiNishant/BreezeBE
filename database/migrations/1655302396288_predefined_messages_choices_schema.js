'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { PREDEFINED_NOT_A_QUESTION, STATUS_ACTIVE } = require('../../app/constants')

class PredefinedMessagesChoicesSchema extends Schema {
  up() {
    this.create('predefined_message_choices', (table) => {
      table.increments()
      table
        .integer('predefined_message_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('predefined_messages')
      table.string('text', 100)
      table
        .integer('next_predefined_message_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('predefined_messages')
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('predefined_message_choices')
  }
}

module.exports = PredefinedMessagesChoicesSchema
