'use strict'

const {
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  MATCH_PERCENT_PASS,
  MATCH_SCORE_GOOD_MATCH,
  MATCH_STATUS_NEW,
  MAX_SEARCH_ITEMS,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
} = require('../constants')

const { isEmpty } = require('lodash')
const Database = use('Database')
const ThirdPartyMatch = use('App/Models/ThirdPartyMatch')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')
const NoticeService = use('App/Services/NoticeService')
const Promise = require('bluebird')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')

class ThirdPartyMatchService {
  static async createNewMatches({ tenant, dist, has_notification_sent = true }) {
    this.deleteOldMatches()
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
      passedEstates.push({ estate_id: estate.id, percent })
      idx++
    }
    const matches =
      passedEstates.map((i) => ({
        user_id: tenant.user_id,
        estate_id: i.estate_id,
        percent: i.percent,
        status: MATCH_STATUS_NEW,
      })) || []

    await this.updateMatches(matches, has_notification_sent)

    return matches
  }

  static async createMatchesForEstate(estate, has_notification_sent = false) {
    let tenants = await Database.from({ _e: 'third_party_offers' })
      .select('_t.*')
      .crossJoin({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', '_e.id')
      })
      .where('_e.id', estate.id)
      .where('_e.status', STATUS_ACTIVE)
      .where('_t.status', STATUS_ACTIVE)
      .where(Database.raw(`tpoi.id IS NULL`))
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
      .limit(MAX_SEARCH_ITEMS)
    const MatchService = require('./MatchService')
    const tenantUserIds = tenants.map((tenant) => tenant.user_id)

    tenants =
      (
        await MatchService.getProspectForScoringQuery()
          .whereIn('tenants.user_id', tenantUserIds)
          .fetch()
      ).toJSON() || []
    // Calculate matches for tenants to current estate
    let passedEstates = []
    let idx = 0

    while (idx < tenants.length) {
      const tenant = tenants[idx]

      estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
      const percent = await MatchService.calculateMatchPercent(tenant, estate)
      passedEstates.push({ user_id: tenant.user_id, estate_id: estate.id, percent })
      idx++
    }

    const matches =
      passedEstates.map((i) => ({
        user_id: i.user_id,
        estate_id: i.estate_id,
        percent: i.percent,
        status: MATCH_STATUS_NEW,
      })) || []

    await this.updateMatches(matches, has_notification_sent)
  }

  static async updateMatches(matches, has_notification_sent = false) {
    if (!matches || !matches.length) {
      return
    }

    let i = 0
    while (i < matches.length) {
      this.upsertSingleMatch(matches[i])
      i++
    }

    if (has_notification_sent) {
      const superMatches = matches.filter(({ percent }) => percent >= MATCH_SCORE_GOOD_MATCH)

      //TODO:
      /*
       * this will send many notifications to users which are not good
       * Approach: need to save start time in match table before calling matchByEstates while calculating new matches
       * And then need to pull out new matches greater than start_time and if there are new matches, need to send notification in group by user_id
       */
      if (superMatches.length > 0) {
        await NoticeService.prospectSuperMatch(superMatches)
      }
    }
  }
  static async upsertSingleMatch(match) {
    const thirdPartyMatch = await this.getNewMatch({
      user_id: match.user_id,
      estate_id: match.estate_id,
    })

    if (thirdPartyMatch) {
      thirdPartyMatch.updateItem(match)
    } else {
      await ThirdPartyMatch.createItem(match)
    }
  }

  static async getNewMatch({ user_id, estate_id }) {
    return await ThirdPartyMatch.query()
      .where('user_id', user_id)
      .where('estate_id', estate_id)
      .where('status', MATCH_STATUS_NEW)
      .first()
  }

  static async deleteOldMatches() {
    const expiredMatches = (
      await ThirdPartyOffer.query()
        .select('_m.id')
        .innerJoin({ _m: 'third_party_matches' }, function () {
          this.on('third_party_offers.id', '_m.estate_id')
        })
        .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
          this.on('tpoi.third_party_offer_id', 'third_party_offers.id')
        })
        .where(Database.raw(`tpoi.id IS NULL`))
        .fetch()
    ).toJSON()

    const expiredMatchIds = expiredMatches.map((match) => match.id)
    if (!expiredMatchIds?.length) {
      return
    }

    await ThirdPartyMatch.query().whereIn('id', expiredMatchIds).delete()
  }

  static async deleteExpiredMatches() {
    // need to remove all matches of which units are already expired and no interaction to that property
    const expiredMatches = (
      await ThirdPartyOffer.query()
        .select('_m.id')
        .innerJoin({ _m: 'third_party_matches' }, function () {
          this.on('third_party_offers.id', '_m.estate_id')
        })
        .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
          this.on('tpoi.third_party_offer_id', 'third_party_offers.id')
        })
        .where('third_party_offers.status', STATUS_EXPIRE)
        .where(Database.raw(`tpoi.id IS NULL`))
        .fetch()
    ).toJSON()

    const expiredMatchIds = expiredMatches.map((match) => match.id)
    if (!expiredMatchIds?.length) {
      return
    }

    await ThirdPartyMatch.query().whereIn('id', expiredMatchIds).delete()
  }

  static async matchByEstates() {
    await this.deleteExpiredMatches()
    const estates = (await ThirdPartyOffer.query().where('status', STATUS_ACTIVE).fetch()).toJSON()
    let i = 0
    while (i < estates.length) {
      await ThirdPartyMatchService.createMatchesForEstate(estates[i], true)
      i++
    }
  }
}

module.exports = ThirdPartyMatchService
