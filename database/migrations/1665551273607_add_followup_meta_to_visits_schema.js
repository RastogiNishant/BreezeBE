'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFollowupMetaToVisitsSchema extends Schema {
  up() {
    this.table('visits', (table) => {
      // we save when the followups were done here
      table.json('landlord_followup_meta').nullable()
      table.json('prospect_followup_meta').nullable()
    })
  }

  down() {
    this.table('visits', (table) => {
      // reverse alternations
      table.dropColumn('landlord_followup_meta')
      table.dropColumn('prospect_followup_meta')
    })
  }
}

module.exports = AddFollowupMetaToVisitsSchema
