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
const Promise = require('bluebird')

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
    const matches =
      passedEstates.map((i) => ({
        user_id: tenant.user_id,
        estate_id: i.estate_id,
        percent: i.percent,
        status: MATCH_STATUS_NEW,
      })) || []

    if (!isEmpty(matches)) {
      //await ThirdPartyMatch.createMany(matches)
      await Promise.map(matches, async (match) => {
        const found = await ThirdPartyMatch.query()
          .where('user_id', tenant.user_id)
          .where('estate_id', match.estate_id)
          .first()
        if (found) {
          await found.updateItem(match)
        } else {
          await ThirdPartyMatch.createItem(match)
        }
      })
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
