'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddCostsToThirdPartyOffersSchema extends Schema {
  up() {
    this.table('third_party_offers', (table) => {
      table
        .decimal('additional_costs')
        .comment(
          'For Ohnemakler: Additional Costs without Heating Costs (nebenkosten_ohne_heizkosten)'
        )
      table.decimal('heating_costs').comment('For OhneMakler: Heating Costs (heizkosten)')
      table
        .decimal('extra_costs')
        .comment('For OhneMakler: Total Additional Costs (summe_nebenkosten)')
    })
  }

  down() {
    this.table('third_party_offers', (table) => {
      table.dropColumn('additional_costs')
      table.dropColumn('heating_costs')
      table.dropColumn('extra_costs')
    })
  }
}

module.exports = AddCostsToThirdPartyOffersSchema
