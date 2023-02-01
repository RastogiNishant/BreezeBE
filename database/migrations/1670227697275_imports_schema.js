'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { IMPORT_TYPE_EXCEL, IMPORT_ENTITY_ESTATES } = require('../../app/constants')

class ImportsSchema extends Schema {
  up() {
    this.create('imports', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users')
      table.string('filename', 256)
      table.string('type', 32).defaultTo(IMPORT_TYPE_EXCEL)
      table.string('entity', 32).defaultTo(IMPORT_ENTITY_ESTATES)
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('imports')
  }
}

module.exports = ImportsSchema
