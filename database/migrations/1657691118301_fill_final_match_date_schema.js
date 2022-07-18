'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const MatchService = use('App/Services/MatchService')
const Match = use('App/Models/Match')
const Database = use('Database')
const { MATCH_STATUS_FINISH } = require('../../app/constants')

class FillFinalMatchDateSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()

    try {
      const matches = await MatchService.getEstatesByStatus({ status: MATCH_STATUS_FINISH })
      console.log('matches.toJSON()', matches.length)
      await Promise.all(
        matches.map(async (m) => {
          await Match.query()
            .where('user_id', m.user_id)
            .where('estate_id', m.estate_id)
            .update({ final_match_date: m.updated_at })
            .transacting(trx)
        })
      )
      await trx.commit()
    } catch (e) {
      console.log('Migration failed', e.message)
      await trx.rollback()
    }
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = FillFinalMatchDateSchema
