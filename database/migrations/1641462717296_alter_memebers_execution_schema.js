'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterMemebersExecutionSchema extends Schema {
  up () {
    this.alter('members', (table) => {
      table.integer('execution').unsigned().defaultTo(null).alter();
    })
  }

  down () {
    this.alter('members', (table) => {
      table.boolean('execution');
    })    
  }
}

module.exports = AlterMemebersExecutionSchema
