'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Estate = use('App/Models/Estate')

const { LETTING_TYPE_LET, STATUS_DELETE, LETTING_STATUS_STANDARD } = require('../../app/constants')
class AdjustLettingTypeLettingStatusSchema extends Schema {
  async up() {
    const estates = await Database.raw(`select e.id from estates e 
          inner join estate_current_tenants ect on ect.estate_id = e.id and ect.status not in (${STATUS_DELETE}) where e.letting_type not in(${LETTING_TYPE_LET})`)
    const estateIds = (estates.rows || []).map((estate) => estate.id)

    if (estateIds && estateIds.length) {
      await Estate.query()
        .whereIn('id', estateIds)
        .update({ letting_type: LETTING_TYPE_LET, letting_status: LETTING_STATUS_STANDARD })
    }
  }

  down() {}
}

module.exports = AdjustLettingTypeLettingStatusSchema
