'use strict'

const {
  STATUS_EXPIRE,
  STATUS_DRAFT,
  MATCH_STATUS_NEW,
  MATCH_STATUS_FINISH,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const Visit = use('App/Models/Visit')

class RemoveExpiredEstatesNewMatches extends Schema {
  async up() {
    const expiredEstatesDb = await Estate.query().select('*').where('status', STATUS_EXPIRE).fetch()
    const draftEstatesDb = await Estate.query().select('*').where('status', STATUS_DRAFT).fetch()

    const expiredEstates = expiredEstatesDb.toJSON()
    const draftEstates = draftEstatesDb.toJSON()

    // Expired estates shouldn't have new match!
    await Match.query()
      .whereIn(
        'estate_id',
        expiredEstates.map((e) => e.id)
      )
      .where('status', MATCH_STATUS_NEW)
      .delete()

    // Draft estates should now have match except final match
    await Match.query()
      .whereIn(
        'estate_id',
        draftEstates.map((e) => e.id)
      )
      .whereNot('status', MATCH_STATUS_FINISH)
      .delete()

    // Draft estates should now have visits except visit of final match
    const finalMatchesOfDraftEstatesDb = await Match.query()
      .select('*')
      .whereIn(
        'estate_id',
        draftEstates.map((e) => e.id)
      )
      .where('status', MATCH_STATUS_FINISH)
      .fetch()

    const finalMatchesOfDraftEstates = finalMatchesOfDraftEstatesDb.toJSON()

    await Visit.query()
      .whereIn(
        'estate_id',
        draftEstates.map((e) => e.id)
      )
      .whereNotIn(
        'estate_id',
        finalMatchesOfDraftEstates.map((m) => m.estate_id)
      )
      .delete()
  }

  down() {}
}

module.exports = RemoveExpiredEstatesNewMatches
