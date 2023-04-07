'use strict'

const {
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  MATCH_PERCENT_PASS,
  MATCH_SCORE_GOOD_MATCH,
} = require('../constants')

const { isEmpty } = require('lodash')
const Database = use('Database')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')
const MatchService = use('App/Services/MatchService')
const NoticeService = use('App/Services/NoticeService')

class ThirdPartyMatchService {
  static async createNewMatches({ tenant, dist, has_notification_sent = true }) {
    const estates = await ThirdPartyOfferService.searchTenantEstatesQuery(tenant, dist)
    let passedEstates = []
    let idx = 0

    while (idx < estates.length) {
      const estate = estates[idx]
      estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
      const percent = await MatchService.calculateMatchPercent(tenant, estate)
      if (percent >= MATCH_PERCENT_PASS) {
        passedEstates.push({ estate_id: estate.id, percent })
      }
      idx++
    }

    const matches = passedEstates.map((i) => ({
      user_id: tenant.user_id,
      estate_id: i.estate_id,
      percent: i.percent,
    }))

    await ThirdPartyMatch.query().where('user_id', tenant.user_id).delete()

    if (!isEmpty(matches)) {
      const insertQuery = Database.query().into('third_party_matches').insert(matches).toString()
      await Database.raw(
        `${insertQuery} ON CONFLICT (user_id, estate_id) DO UPDATE SET "percent" = EXCLUDED.percent`
      )

      if (has_notification_sent) {
        const superMatches = matches.filter(({ percent }) => percent >= MATCH_SCORE_GOOD_MATCH)
        if (superMatches.length > 0) {
          await NoticeService.prospectSuperMatch(superMatches)
        }
      }
    }

    return matches?.length || 0
  }
}

module.exports = ThirdPartyMatchService
