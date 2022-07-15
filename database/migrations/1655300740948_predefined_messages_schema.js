'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { PREDEFINED_NOT_A_QUESTION, STATUS_ACTIVE } = require('../../app/constants')

class PredefinedMessagesSchema extends Schema {
  up() {
    this.create('predefined_messages', (table) => {
      table.increments()
      table.string('text', 500)
      table.integer('type').unsigned().defaultTo(PREDEFINED_NOT_A_QUESTION)
      table.string('variable_to_update', 32)
      table.integer('step')
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))

      table.unique(['step'])
    })
  }

  down() {
    this.drop('predefined_messages')
  }
}

module.exports = PredefinedMessagesSchema
