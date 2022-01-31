'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class CreatePlanSchema extends Schema {
  up () {
    this.create('plans', (table) => {
      table.increments()
      table.string('name', 255).notNullable()
      table.string('description', 255)
      table.decimal('prices').defaultTo(0)      
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down () {
    this.drop('plans')
  }
}

module.exports = CreatePlanSchema
