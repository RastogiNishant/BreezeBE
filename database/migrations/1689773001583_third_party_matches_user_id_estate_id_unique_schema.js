'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ThirdPartyMatchesUserIdEstateIdUniqueSchema extends Schema {
  up() {
    this.table('third_party_matches', (table) => {
      // alter table
      table.unique(['user_id', 'estate_id'])
    })
  }

  down() {}
}

module.exports = ThirdPartyMatchesUserIdEstateIdUniqueSchema
