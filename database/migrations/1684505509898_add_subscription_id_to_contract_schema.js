'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddSubscriptionIdToContractSchema extends Schema {
  up() {
    this.table('contracts', (table) => {
      // alter table
      table.string('subscription_id').index()
    })
  }

  down() {
    this.table('contracts', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddSubscriptionIdToContractSchema
