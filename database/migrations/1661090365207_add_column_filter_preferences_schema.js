'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddColumnFilterPreferencesSchema extends Schema {
  up() {
    this.create('filter_columns_preferences', (table) => {
      table.increments()
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .notNullable()
      table
        .integer('filter_columns_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('filter_columns')
      table.boolean('visible').defaultTo(true)
      table.integer('order').unsigned().defaultTo(1)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))

      table.unique(['user_id', 'filter_columns_id'])
    })
  }

  down() {
    this.drop('filter_columns_preferences')
  }
}

module.exports = AddColumnFilterPreferencesSchema
