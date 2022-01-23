'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class MembersSchema extends Schema {
  up () {
    this.alter('members', (table) => {
      table.integer('unpaid_rental').unsigned().defaultTo(null).alter();
      table.integer('insolvency_proceed').unsigned().defaultTo(null).alter();
      table.integer('arrest_warranty').unsigned().defaultTo(null).alter();
      table.integer('clean_procedure').unsigned().defaultTo(null).alter();
      table.integer('income_seizure').unsigned().defaultTo(null).alter();
    })
  }

  down () {
    this.alter('members', (table) => {
      table.boolean('unpaid_rental');
      table.boolean('insolvency_proceed');
      table.boolean('arrest_warranty');
      table.boolean('clean_procedure');
      table.boolean('income_seizure');    
    })    
  }
}

module.exports = MembersSchema
