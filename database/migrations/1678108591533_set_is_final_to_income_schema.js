'use strict'

const { MATCH_STATUS_FINISH } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const Member = use('App/Models/Member')
const Income = use('App/Models/Income')

class SetIsFinalToIncomeSchema extends Schema {
  async up() {
    const finalMatches = (await Match.query().where('status', MATCH_STATUS_FINISH).fetch()).toJSON()
    if (!finalMatches || !finalMatches.length) return

    const userIds = finalMatches.map((match) => match.user_id)
    const members = (await Member.query().whereIn('user_id', userIds).fetch()).toJSON()
    if (!members || !members.length) return
    const memberIds = members.map((member) => member.id)

    await Income.query().whereIn('member_id', memberIds).update({ is_final: true })
  }

  down() {}
}

module.exports = SetIsFinalToIncomeSchema
