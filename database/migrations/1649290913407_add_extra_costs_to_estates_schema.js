'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddExtraCostsToEstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table
        .decimal('extra_costs')
        .default(0)
        .comment(
          'Extra costs is usually the sum of heating and additional(utility) costs. But this can be set if heating and additional costs are both zero.'
        )
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
      table.dropColumn('extra_costs')
    })
  }
}

module.exports = AddExtraCostsToEstatesSchema
