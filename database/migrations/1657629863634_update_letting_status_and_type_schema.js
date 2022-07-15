'use strict'

const {
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_STATUS_NORMAL,
  MATCH_STATUS_FINISH,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

const Match = use('App/Models/Match')
const Estate = use('App/Models/Estate')

class UpdateLettingStatusAndTypeSchema extends Schema {
  async up() {
    const finalMatches = await Match.query().where({ status: MATCH_STATUS_FINISH }).fetch()
    const finalMatchedIds = finalMatches.rows.map((match) => match.estate_id)

    // Update final matched estates' letting status and type
    await Estate.query().whereIn('id', finalMatchedIds).update({
      letting_status: LETTING_STATUS_NORMAL,
      letting_type: LETTING_TYPE_LET,
    })

    // Update not final matched estates' letting status and type
    await Estate.query().whereNotIn('id', finalMatchedIds).update({
      letting_status: null,
      letting_type: LETTING_TYPE_VOID,
    })
  }
}

module.exports = UpdateLettingStatusAndTypeSchema
