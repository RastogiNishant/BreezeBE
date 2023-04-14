'use strict'

const {
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  MATCH_PERCENT_PASS,
  MATCH_SCORE_GOOD_MATCH,
  MATCH_STATUS_NEW,
  MAX_SEARCH_ITEMS,
} = require('../constants')

const { isEmpty } = require('lodash')
const Database = use('Database')
const ThirdPartyMatch = use('App/Models/ThirdPartyMatch')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')
const NoticeService = use('App/Services/NoticeService')

class ThirdPartyMatchService {
  static async createNewMatches({ tenant, dist, has_notification_sent = true }) {
    const estates = await ThirdPartyOfferService.searchTenantEstatesQuery(tenant, dist).limit(
      MAX_SEARCH_ITEMS
    )
    let passedEstates = []
    let idx = 0
    const MatchService = require('./MatchService')
    while (idx < estates.length) {
      let estate = estates[idx]
      estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
      const percent = await MatchService.calculateMatchPercent(tenant, estate)
      if (percent >= MATCH_PERCENT_PASS) {
        passedEstates.push({ estate_id: estate.id, percent })
      }
      idx++
    }
    let matchedEstateIds = []
    const matches =
      passedEstates.map((i) => {
        matchedEstateIds = [...matchedEstateIds, i.estate_id]
        return {
          user_id: tenant.user_id,
          estate_id: i.estate_id,
          percent: i.percent,
          status: MATCH_STATUS_NEW,
        }
      }) || []

    await ThirdPartyMatch.query()
      .where('user_id', tenant.user_id)
      .where('status', MATCH_STATUS_NEW)
      .delete()

    //delete third_party_offer_interactions not anymore in the match table
    await ThirdPartyOfferInteraction.query()
      .where('user_id', tenant.user_id)
      .whereNotIn('third_party_offer_id', matchedEstateIds)
      .delete()

    if (!isEmpty(matches)) {
      await ThirdPartyMatch.createMany(matches)
      if (has_notification_sent) {
        const superMatches = matches.filter(({ percent }) => percent >= MATCH_SCORE_GOOD_MATCH)
        if (superMatches.length > 0) {
          await NoticeService.prospectSuperMatch(superMatches)
        }
      }
    }

    return matches
  }
}

module.exports = ThirdPartyMatchService
