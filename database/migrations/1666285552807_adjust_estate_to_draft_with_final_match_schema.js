'use strict'

const { MATCH_STATUS_FINISH, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Estate = use('App/Models/Estate')

class AdjustEstateToDraftWithFinalMatchSchema extends Schema {
  async up() {
    const finalMatches = await Match.query()
      .select('estate_id')
      .where('status', MATCH_STATUS_FINISH)
      .fetch()

    const estate_ids = (finalMatches.toJSON() || []).map((fm) => fm.estate_id)
    await Estate.query().whereIn('id', estate_ids).update({ status: STATUS_DRAFT })
  }

  down() {}
}

module.exports = AdjustEstateToDraftWithFinalMatchSchema
