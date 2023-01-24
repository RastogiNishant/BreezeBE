'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const MatchService = use('App/Services/MatchService')
const Promise = require('bluebird')

class FixNotANumberMatchResultsSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      const nanMatches = await Match.query().where('percent', 'NaN').fetch()
      try {
        await Promise.all(
          nanMatches.toJSON().map(async (match) => {
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
                  percent: matchScore,
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

  down() {}
}

module.exports = FixNotANumberMatchResultsSchema
