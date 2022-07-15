'use strict'
const Match = use('App/Models/Match')
const MatchService = use('App/Services/MatchService')
const Promise = require('bluebird')
const Database = use('Database')
const _ = require('lodash')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RecalculateMatchScoresSchema extends Schema {
  async up() {
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
        let matchScore = MatchService.calculateMatchPercent(prospect, estate).toFixed(2)
        console.log(
          `User: ${matchEstateUser.user_id}, Estate: ${matchEstateUser.estate_id}, Score: ${matchScore}`
        )
        try {
          await Match.query()
            .where('user_id', matchEstateUser.user_id)
            .where('estate_id', matchEstateUser.estate_id)
            .update({ percent: matchScore }, trx)
          await trx.commit()
        } catch (error) {
          await trx.rollback()
        }
      }
    })
  }

  down() {}
}

module.exports = RecalculateMatchScoresSchema
