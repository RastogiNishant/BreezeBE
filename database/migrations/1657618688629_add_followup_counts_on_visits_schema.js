'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFollowupCountsOnVisitsSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      table.smallint('landlord_followup_count').default(0)
      table.smallint('prospect_followup_count').default(0)
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
      table.dropColumn('landlord_followup_count')
      table.dropColumn('prospect_followup_count')
    })
  }
}

module.exports = AddFollowupCountsOnVisitsSchema
