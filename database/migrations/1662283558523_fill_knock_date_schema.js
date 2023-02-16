'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Database = use('Database')
const { MATCH_STATUS_KNOCK } = require('../../app/constants')

class FillKnockDateSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()

    try {
      const matches = (await Match.query().where('status', '>=', MATCH_STATUS_KNOCK).fetch()).rows
      await Promise.all(
        matches.map(async (m) => {
          await Match.query()
            .where('user_id', m.user_id)
            .where('estate_id', m.estate_id)
            .where('status', m.status)
            .update({ knocked_at: m.updated_at })
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

module.exports = FillKnockDateSchema
