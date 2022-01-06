'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { BASIC_MEMBER } = require('../../app/constants')
class AlterUsersPaymentFieldsSchema extends Schema {
  async up () {
    this.alter('users', async(table) => {
      // alter table
      table.integer('is_premium').unsigned().defaultTo(BASIC_MEMBER).alter();
    })
    const exists = await this.hasColumn('users', 'payment_plan')
    if( exists ) {
console.log('exists===', exists)      
      await this.table('users', async(table) => {
        await table.dropColumn('payment_plan')
      })
    }

    this.table('users', (table) => {
      table.integer('payment_plan');        
    })          
  }

  down () {
    this.alter('users', (table) => {
      // reverse alternations
      table.boolean('is_premium').defaultTo(false).alter()
    })
  }
}

module.exports = AlterUsersPaymentFieldsSchema
