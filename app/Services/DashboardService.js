'use strict'

const {
  STATUS_DELETE,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  STATUS_DRAFT,
} = require('../constants')

const Estate = use('App/Models/Estate')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Match = use('App/Models/Match')
const Database = use('Database')

class DashboardService {
  static async getDashboardCounts(user_id) {
    const estateCount = await Estate.query()
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .count()

    const connectCount = await Estate.query()
      .where('letting_type', LETTING_TYPE_LET)
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .count()

    const matchCount = await Estate.query()
      .where('user_id', user_id)
      .whereIn('letting_type', [LETTING_TYPE_VOID, LETTING_TYPE_NA])
      .whereNot('status', STATUS_DELETE)
      .count(Database.raw(`DISTINCT(estates.id)`))

    return {
      estate: estateCount[0].count,
      connect: connectCount[0].count,
      match: matchCount[0].count,
    }
  }
}

module.exports = DashboardService
