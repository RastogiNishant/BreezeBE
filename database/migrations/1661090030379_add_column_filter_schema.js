'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { STATUS_ACTIVE } = require('../../app/constants')

class AddColumnFilterSchema extends Schema {
  up() {
    this.create('filter_columns', (table) => {
      table.increments()
      table.enum('filterName', ['estate', 'connect', 'match']).nullable()
      table.string('tableName')
      table.string('tableAlias')
      table.string('fieldName')
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.integer('order').unsigned().defaultTo(1)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('filter_columns')
  }
}

module.exports = AddColumnFilterSchema
