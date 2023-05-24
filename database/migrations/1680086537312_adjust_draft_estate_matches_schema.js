'use strict'

const { STATUS_DELETE, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const EstateService = use('App/Services/EstateService')
const Database = use('Database')

class AdjustDraftEstateMatchesSchema extends Schema {
  async up() {
    const estates = (await Estate.query().whereIn('status', [STATUS_DELETE, STATUS_DRAFT]).fetch())
      .rows
    let i = 0
    const trx = await Database.beginTransaction()
    try {
      while (i < estates.length) {
        const estate = estates[i]
        await EstateService.handleOfflineEstate(
          { estate_id: estate.id, is_notification: false },
          trx
        )
        i++
      }
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log('Failed to adjust draft estates')
    }
  }

  down() {
    this.table('adjust_draft_estate_matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustDraftEstateMatchesSchema
