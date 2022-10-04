'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddLetterTemplateSchema extends Schema {
  up() {
    this.create('letter_templates', (table) => {
      table.increments()
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies')
      table.string('title')
      table.text('body')
      table.string('logo')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('letter_templates')
  }
}

module.exports = AddLetterTemplateSchema
