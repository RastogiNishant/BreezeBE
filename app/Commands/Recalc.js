'use strict'

const { Command } = require('@adonisjs/ace')
const Promise = require('bluebird')
const MatchService = use('App/Services/MatchService')
const Database = use('Database')
const Match = use('App/Models/Match')

class Recalc extends Command {
  static get signature() {
    return 'app:recalculate_scores'
  }

  static get description() {
    return 'Run match recalculation for all current matches.'
  }

  async handle(args, options) {
    const matchEstateUsers = await Match.query().select('estate_id', 'user_id').fetch()
    let prospects = {}
    let estates = {}
    const trx = await Database.beginTransaction()
    await Promise.map(matchEstateUsers.toJSON(), async (matchEstateUser) => {
      let prospect
      if (!prospects[matchEstateUser.user_id]) {
        prospect = await MatchService.getProspectForScoringQuery()
          .where(`tenants.user_id`, matchEstateUser.user_id)
          .first()
        prospects[matchEstateUser.user_id] = prospect
      } else {
        prospect = prospects[matchEstateUser.user_id]
      }
      let estate
      if (!estates[matchEstateUser.estate_id]) {
        estate = await MatchService.getEstateForScoringQuery()
          .where('estates.id', matchEstateUser.estate_id)
          .first()
        estates[matchEstateUser.estate_id] = estate
      } else {
        estate = estates[matchEstateUser.estate_id]
      }
      if (prospect && estate) {
        const matchScore = await MatchService.calculateMatchPercent(prospect, estate).toFixed(2)
        try {
          await Match.query()
            .where('user_id', matchEstateUser.user_id)
            .where('estate_id', matchEstateUser.estate_id)
            .update({ percent: matchScore }, trx)
          trx.commit()
        } catch (error) {
          trx.rollback()
        }
      }
    })
  }
}

module.exports = Recalc
