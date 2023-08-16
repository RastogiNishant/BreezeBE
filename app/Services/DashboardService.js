'use strict'

const {
  STATUS_DELETE,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  LETTING_TYPE_NA,
  STATUS_DRAFT,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
} = require('../constants')

const Estate = use('App/Models/Estate')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Match = use('App/Models/Match')
const Database = use('Database')
const EstateService = use('App/Services/EstateService')

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

    const buildEstateCount = await EstateService.buildEstateCount({
      user_id,
      params: { status: [STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE] },
    })
    const noBuildEstateCount = await EstateService.noBuildEstateCount({
      user_id,
      params: { status: [STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE] },
    })

    return {
      estate: estateCount[0].count,
      connect: connectCount[0].count,
      match: buildEstateCount + noBuildEstateCount,
    }
  }
}

module.exports = DashboardService
