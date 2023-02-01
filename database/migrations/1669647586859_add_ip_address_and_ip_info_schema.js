'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddIpAddressAndIpInfoSchema extends Schema {
  up() {
    this.table('users', (table) => {
      table.string('ip', 45) //ipv6 compatible
      table.json('ip_based_info')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
      table.dropColumn('ip')
      table.dropColumn('ip_based_info')
    })
  }
}

module.exports = AddIpAddressAndIpInfoSchema
