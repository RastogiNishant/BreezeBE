'use strict'

const { STATUS_DELETE, LETTING_TYPE_LET } = require('../constants')

const Estate = use('App/Models/Estate')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Match = use('App/Models/Match')

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

    const matchCount = await Match.query()
      .innerJoin({ _e: 'estates' }, function () {
        this.on('_e.id', 'matches.estate_id')
          .on('_e.user_id', user_id)
          .onNotIn('_e.status', STATUS_DELETE)
      })
      .count()

    return {
      estate: estateCount[0].count,
      connect: connectCount[0].count,
      match: matchCount[0].count,
    }
  }
}

module.exports = DashboardService
