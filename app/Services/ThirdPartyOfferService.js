const axios = require('axios')
const moment = require('moment')
const OhneMakler = require('../Classes/OhneMakler')
const crypto = require('crypto')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const DataStorage = use('DataStorage')
const Database = use('Database')
const Promise = require('bluebird')
const {
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER,
  OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING,
  SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
  ISO_DATE_FORMAT,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_NEW,
  STATUS_DELETE,
} = require('../constants')
const QueueService = use('App/Services/QueueService')
const EstateService = use('App/Services/EstateService')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const {
  exceptions: { ALREADY_KNOCKED_ON_THIRD_PARTY, CANNOT_KNOCK_ON_DISLIKED_ESTATE },
} = require('../exceptions')
const HttpException = require('../Exceptions/HttpException')

class ThirdPartyOfferService {
  static generateChecksum(data) {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex')
  }

  static async getOhneMaklerChecksum() {
    return await DataStorage.getItem('ohne-makler-checksum')
  }

  static async setOhneMaklerChecksum(checksum) {
    return await DataStorage.setItem('ohne-makler-checksum', checksum, '', {
      expire: 7 * 24 * 60 * 60,
    })
  }

  static async pullOhneMakler(forced = false) {
    if (!forced) {
      if (
        process.env.PROCESS_OHNE_MAKLER_GET_ESTATES === undefined ||
        (process.env.PROCESS_OHNE_MAKLER_GET_ESTATES !== undefined &&
          !+process.env.PROCESS_OHNE_MAKLER_GET_ESTATES)
      ) {
        console.log('not pulling ohne makler...')
        return
      }
    }
    console.log('pullOnheMaker start!!!!')
    let ohneMaklerData
    try {
      const { data } = await axios.get(process.env.OHNE_MAKLER_API_URL, { timeout: 5000 })
      if (!data) {
        console.log('Error found on pulling ohne makler')
        throw new Error('Error found on pulling ohne makler')
      }
      ohneMaklerData = data
    } catch (e) {
      console.log('Failed to fetch data!!!!')
      throw new Error('Failed to fetch data!!!!')
    }

    try {
      const ohneMaklerChecksum = await ThirdPartyOfferService.getOhneMaklerChecksum()
      const checksum = ThirdPartyOfferService.generateChecksum(JSON.stringify(ohneMaklerData))
      if (checksum !== ohneMaklerChecksum || forced) {
        console.log('updating start !!!!')
        //mark all as expired...
        //1. to expire all estates that are not anymore in the new data including also those
        //that are past expiration date
        //2. to allow for changes on type see OhneMakler.estateCanBeProcessed()
        //there must be some difference between the data... so we can process
        const ohneMakler = new OhneMakler(ohneMaklerData)
        const estates = ohneMakler.process()

        const retainIds = estates.map((estate) => estate.source_id)
        await ThirdPartyOfferService.expireWhenNotOnSourceIds(retainIds)

        let i = 0
        while (i < estates.length) {
          let estate = estates[i]
          try {
            const found = await ThirdPartyOffer.query()
              .where('source', THIRD_PARTY_OFFER_SOURCE_OHNE_MAKLER)
              .where('source_id', estate.source_id)
              .first()
            if (!found) {
              await ThirdPartyOffer.createItem(estate)
            } else {
              await found.updateItem(estate)
            }
          } catch (e) {
            console.log(`validation: ${estate.source_id} ${e.message}`)
          }
          i++
        }
        console.log('End of updating!!!!')
        await ThirdPartyOfferService.setOhneMaklerChecksum(checksum)
      }
    } catch (e) {
      console.log('pullOhneMakler error', e.message)
    }
  }

  static async expireWhenNotOnSourceIds(sourceIds) {
    await ThirdPartyOffer.query()
      .whereNotIn('source_id', sourceIds)
      .update({ status: STATUS_EXPIRE })
  }

  static async getEstates(userId, limit = 10, exclude) {
    const MatchService = require('./MatchService')
    const tenant = await MatchService.getProspectForScoringQuery()
      .where({ 'tenants.user_id': userId })
      .first()
    let estates = await ThirdPartyOfferService.searchEstatesQuery(userId, null, exclude).fetch()
    estates = estates.toJSON()
    estates = await Promise.all(
      estates.map(async (estate) => {
        estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
        const score = await MatchService.calculateMatchPercent(tenant, estate)
        estate.match = score
        estate.isoline = await EstateService.getIsolines(estate)
        estate['__meta__'] = {
          knocked_count: estate.knocked_count,
          like_count: estate.like_count,
          dislike_count: estate.dislike_count,
        }
        estate.rooms = null
        return estate
      })
    )
    estates.sort((a, b) => (+a.match > +b.match ? -1 : 1))
    estates = estates.slice(0, limit)
    return estates
  }

  static async searchTenantEstatesByPoint(point_id) {
    return await Database.select(Database.raw(`FALSE as inside`))
      .select(
        '_e.id',
        '_e.source_id',
        '_e.source',
        '_e.coord_raw as coord',
        '_e.house_number',
        '_e.street',
        '_e.city',
        '_e.country',
        '_e.address'
      )
      .from({ _e: 'third_party_offers' })
      .innerJoin({ _p: 'points' }, function () {
        this.on('_p.id', point_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static searchTenantEstatesQuery(tenant, radius) {
    return Database.select(Database.raw(`FALSE as inside`))
      .select('_e.*')
      .select(Database.raw(`NULL as rooms`))
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'third_party_offers' })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', '_e.id').on('tpoi.user_id', tenant.user_id)
      })
      .where('_e.status', STATUS_ACTIVE)
      .whereNull('tpoi.id')
      .where('_t.user_id', tenant.user_id)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static getActiveMatchesQuery(userId) {
    return ThirdPartyOffer.query()
      .innerJoin({ _m: 'third_party_matches' }, function () {
        this.on('_m.estate_id', 'third_party_offers.id')
          .onIn('_m.user_id', [userId])
          .onIn('_m.status', MATCH_STATUS_NEW)
      })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', 'third_party_offers.id').on('tpoi.user_id', userId)
      })
      .where('third_party_offers.status', STATUS_ACTIVE)
      .whereNull('tpoi.id')
  }

  static async getNewMatchCount(userId) {
    return (await this.getActiveMatchesQuery(userId).count('*'))?.[0]?.count || 0
  }

  static async getMatches(userId, from = 0, limit = 20) {
    return (
      await this.getActiveMatchesQuery(userId)
        .select('third_party_offers.*')
        .select('third_party_offers.status as estate_status')
        .select(Database.raw(`_m.percent AS match`))
        .select(Database.raw(`NULL as rooms`))
        .withCount('likes')
        .withCount('dislikes')
        .withCount('knocks')
        .orderBy('_m.percent', 'DESC')
        .offset(from)
        .limit(limit)
        .fetch()
    ).toJSON()
  }

  static async getEstate(userId, id) {
    /* estate coord intersects with polygon of tenant */
    return await ThirdPartyOffer.query()
      .select('third_party_offers.*')
      .select('third_party_offers.status as estate_status')
      .select(Database.raw(`_m.percent AS match`))
      .select(Database.raw(`NULL as rooms`))
      .withCount('likes')
      .withCount('dislikes')
      .withCount('knocks')
      .innerJoin({ _m: 'third_party_matches' }, function () {
        this.on('_m.estate_id', 'third_party_offers.id').onIn('_m.user_id', [userId])
      })
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', 'third_party_offers.id').on('tpoi.user_id', userId)
      })
      //remove the check on intersecting with polygon because user may have changed
      //his location and he won't be intersected here...
      .where('third_party_offers.id', id)
      .first()
  }

  static async postAction(userId, id, action, comment = '', message = '') {
    const found = await ThirdPartyOfferInteraction.query()
      .where('third_party_offer_id', id)
      .where('user_id', userId)
      .first()
    let value
    switch (action) {
      case 'like':
      case 'dislike':
        value = { third_party_offer_id: id, user_id: userId, liked: action === 'like' }
        break
      case 'comment':
        value = { third_party_offer_id: id, user_id: userId, comment }
        break
      case 'knock':
        const actionFound = await ThirdPartyOfferInteraction.query()
          .where('third_party_offer_id', id)
          .where('user_id', userId)
          .first()
        if (actionFound?.knocked) {
          throw new HttpException(ALREADY_KNOCKED_ON_THIRD_PARTY, 400)
        }
        if (actionFound?.like === false) {
          throw new HttpException(CANNOT_KNOCK_ON_DISLIKED_ESTATE, 400)
        }
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: true,
          liked: null,
          knocked_at: moment().utc().format(),
        }
        QueueService.contactOhneMakler({
          third_party_offer_id: id,
          userId,
          message: SEND_EMAIL_TO_OHNEMAKLER_CONTENT,
        })
        break
      case 'cancel knock':
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: false,
          liked: false,
        }
        break
    }
    if (!found) {
      await ThirdPartyOfferInteraction.createItem(value)
    } else {
      await found.updateItem(value)
    }
    return true
  }

  static async getKnockedCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('knocked', true)
      .count()
  }

  static async getLikesCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('liked', true)
      .where(Database.raw(`knocked is not true`))
      .count()
  }

  static async getDisLikesCount(userId) {
    return await ThirdPartyOfferInteraction.query()
      .where('user_id', userId)
      .where('liked', false)
      .where(Database.raw(`knocked is not true`))
      .count()
  }

  static async getTenantEstatesWithFilter(userId, filter) {
    const MatchService = require('./MatchService')
    const { like, dislike, knock } = filter
    let query = ThirdPartyOffer.query()
      .select('third_party_offers.*')
      .select(
        'third_party_offers.status as estate_status',
        'third_party_offers.*',
        'tpoi.knocked_at'
      )

    let field
    let value
    if (like) {
      field = 'liked'
      value = true
      query
        .select(Database.raw(`tpoi.updated_at as action_at`))
        .where(Database.raw(`knocked is not true`))
    } else if (dislike) {
      field = 'liked'
      value = false
      query
        .select(Database.raw(`tpoi.updated_at as action_at`))
        .where(Database.raw(`knocked is not true`))
    } else if (knock) {
      field = 'knocked'
      value = true
      query
        .select(Database.raw(`tpoi.knocked_at as action_at`))
        .select(Database.raw(`${MATCH_STATUS_KNOCK} as status`))
    } else {
      return []
    }
    query
      .innerJoin(Database.raw(`third_party_offer_interactions as tpoi`), function () {
        this.on('third_party_offers.id', 'tpoi.third_party_offer_id')
          .on(Database.raw(`"${field}" = ${value}`))
          .on(Database.raw(`"user_id" = ${userId}`))
      })
      .orderBy('tpoi.updated_at', 'desc')
    const ret = await query.fetch()
    if (ret) {
      const tenant = await MatchService.getProspectForScoringQuery()
        .where({ 'tenants.user_id': userId })
        .first()
      let estates = ret.toJSON()
      estates = await Promise.all(
        estates.map(async (estate) => {
          estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
          const score = await MatchService.calculateMatchPercent(tenant, estate)
          estate.match = score
          estate.rooms = null
          return estate
        })
      )
      return estates
    }
    return []
  }
}

module.exports = ThirdPartyOfferService
