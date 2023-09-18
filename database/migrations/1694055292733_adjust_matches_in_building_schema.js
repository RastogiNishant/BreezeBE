'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Promise = require('bluebird')
const Database = use('Database')
const { groupBy, maxBy } = require('lodash')
const Match = use('App/Models/Match')
class AdjustMatchesInBuildingSchema extends Schema {
  async up() {
    const matches = await Database.raw(
      `SELECT m.user_id, m.estate_id, m.status, e.build_id from matches m inner join estates e on e.id = m.estate_id and e.build_id is not null where m.status > 2`
    )

    const groupMatches = groupBy(matches.rows, (match) => `${match.build_id}_${match.user_id}`)
    const trx = await Database.beginTransaction()
    try {
      await Promise.map(
        Object.keys(groupMatches),
        async (key) => {
          if (groupMatches[key]?.length > 1) {
            const estate = maxBy(groupMatches[key], 'status')
            const estate_id = estate.estate_id
            const build_id = groupMatches[key][0].build_id
            const user_id = groupMatches[key][0].user_id
            const estate_ids = groupMatches[key]
              .map((estate) => estate.estate_id)
              .filter((id) => id !== estate_id)
            await Match.query()
              .where('user_id', user_id)
              .whereIn('estate_id', estate_ids)
              .delete()
              .transacting(trx)
          }
        },
        { concurrency: 1 }
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log('AdjustMatchesInBuildingSchema error', e.message)
    }
  }

  down() {}
}

module.exports = AdjustMatchesInBuildingSchema
