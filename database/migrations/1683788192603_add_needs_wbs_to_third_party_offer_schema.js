'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddNeedsWbsToThirdPartyOfferSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table
        .boolean('wbs')
        .default(false)
        .comment(
          'When true means that this property can only be rented with public housing certificate ("WBS")'
        )
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
      table.dropColumn('wbs')
    })
  }
}

module.exports = AddNeedsWbsToThirdPartyOfferSchema
