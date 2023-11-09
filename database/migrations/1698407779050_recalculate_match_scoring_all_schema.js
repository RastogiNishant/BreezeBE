'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const MatchService = use('App/Services/MatchService')
const Match = use('App/Models/Match')
const Promise = use('bluebird')

class RecalculateMatchScoringAllSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      const matchesToRecalculate = await Match.query()
        .where('created_at', '>', '2023-09-01')
        .fetch()
      try {
        await Promise.all(
          matchesToRecalculate.toJSON().map(async (match) => {
            const prospect = await MatchService.getProspectForScoringQuery()
              .where(`tenants.user_id`, match.user_id)
              .first()
            const estate = await MatchService.getEstateForScoringQuery()
              .where('estates.id', match.estate_id)
              .first()
            const matchScore = await MatchService.calculateMatchPercent(prospect, estate)
            await Match.query()
              .where('user_id', match.user_id)
              .where('estate_id', match.estate_id)
              .update(
                {
                  landlord_score: matchScore.landlord_score,
                  prospect_score: matchScore.prospect_score,
                  percent: matchScore.percent
                },
                trx
              )
          })
        )
        await trx.commit()
      } catch (err) {
        console.log(err.message)
        await trx.rollback()
      }
    })
  }

  down() {}
}

module.exports = RecalculateMatchScoringAllSchema
