'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const MatchService = use('App/Services/MatchService')
const Match = use('App/Models/Match')

class RecalculateMatchScoringSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      const matchesToRecalculate = await Match.query().where('user_id', 18350).fetch()
      try {
        await Promise.all(
          matchesToRecalculate.toJSON().map(async (match) => {
            const prospect = await MatchService.getProspectForScoringQuery()
              .where(`tenants.user_id`, match.user_id)
              .first()
            const estate = await MatchService.getEstateForScoringQuery()
              .where('estates.id', match.estate_id)
              .first()
            const matchScore = await MatchService.calculateMatchPercent(prospect, estate).toFixed(2)
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
        await trx.rollback()
      }
    })
  }

  down() {
    this.table('recalculate_match_scorings', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RecalculateMatchScoringSchema
