'use strict'

const { MATCH_STATUS_FINISH, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Estate = use('App/Models/Estate')

class MakeFinalMatchedEstatesDraft extends Schema {
  async up() {
    const finalMatches = await Match.query().where({ status: MATCH_STATUS_FINISH }).fetch()
    const estateIds = finalMatches.rows.map((match) => match.estate_id)
    await Estate.query().whereIn('id', estateIds).update({ status: STATUS_DRAFT })
  }

  down() {}
}

module.exports = MakeFinalMatchedEstatesDraft
