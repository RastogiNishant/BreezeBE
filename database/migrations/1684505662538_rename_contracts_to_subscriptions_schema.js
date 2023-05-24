'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RenameContractsToSubscriptionsSchema extends Schema {
  up() {
    this.rename('contracts', 'subscriptions')
  }

  down() {
    this.rename('subscriptions', 'contracts')
  }
}

module.exports = RenameContractsToSubscriptionsSchema
