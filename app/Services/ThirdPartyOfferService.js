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
} = require('../constants')
const QueueService = use('App/Services/QueueService')
const EstateService = use('App/Services/EstateService')
const Tenant = use('App/Models/Tenant')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const MatchService = use('App/Services/MatchService')
const {
  exceptions: {
    ALREADY_KNOCKED_ON_THIRD_PARTY,
    CANNOT_KNOCK_ON_DISLIKED_ESTATE,
    THIRD_PARTY_OFFER_NOT_FOUND,
  },
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
    if (
      process.env.PROCESS_OHNE_MAKLER_GET_ESTATES === undefined ||
      (process.env.PROCESS_OHNE_MAKLER_GET_ESTATES !== undefined &&
        !+process.env.PROCESS_OHNE_MAKLER_GET_ESTATES)
    ) {
      console.log('not pulling ohne makler...')
      return
    }

    let ohneMaklerData
    try {
      const { data } = await axios.get(process.env.OHNE_MAKLER_API_URL, { timeout: 2000 })
      if (!data) {
        throw new Error('Error found on pulling ohne makler')
      }
      ohneMaklerData = data
    } catch (e) {
      throw new Error('Failed to fetch data!!!!')
    }

    try {
      const ohneMaklerChecksum = await ThirdPartyOfferService.getOhneMaklerChecksum()
      const checksum = ThirdPartyOfferService.generateChecksum(JSON.stringify(ohneMaklerData))
      if (checksum !== ohneMaklerChecksum || forced) {
        //mark all as expired...
        //1. to expire all estates that are not anymore in the new data including also those
        //that are past expiration date
        //2. to allow for changes on type see OhneMakler.estateCanBeProcessed()
        await Database.raw(`UPDATE third_party_offers SET status='${STATUS_EXPIRE}'`)
        //there must be some difference between the data... so we can process
        const ohneMakler = new OhneMakler(ohneMaklerData)
        const estates = ohneMakler.process()

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

        await ThirdPartyOfferService.setOhneMaklerChecksum(checksum)
      }
    } catch (e) {
      console.log('pullOhneMakler error', e.message)
    }
  }

  static async getEstates(userId, limit = 10, exclude) {
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

  static async getEstate(userId, third_party_offer_id) {
    let estate = await ThirdPartyOfferService.searchEstatesQuery(
      userId,
      third_party_offer_id
    ).first()
    if (!estate) {
      throw new HttpException(THIRD_PARTY_OFFER_NOT_FOUND, 400)
    }
    estate = estate.toJSON()
    estate['__meta__'] = {
      knocked_count: estate.knocked_count,
      like_count: estate.like_count,
      dislike_count: estate.dislike_count,
    }
    const tenant = await MatchService.getProspectForScoringQuery()
      .where({ 'tenants.user_id': userId })
      .first()
    estate = { ...estate, ...OHNE_MAKLER_DEFAULT_PREFERENCES_FOR_MATCH_SCORING }
    const score = await MatchService.calculateMatchPercent(tenant, estate)
    estate.percent = score
    estate.rooms = null
    return estate
  }

  static searchTenantEstatesQuery(tenant, radius) {
    return Database.select(Database.raw(`FALSE as inside`))
      .select('_e.*')
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'third_party_offers' })
      .where('_t.user_id', tenant.user_id)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  static getActiveMatchesQuery(userId) {
    
  }

  static searchEstatesQuery(userId, id = false, exclude = []) {
    /* estate coord intersects with polygon of tenant */
    let query = Tenant.query()
      .select(
        '_e.price as net_rent',
        '_e.floor_count as number_floors',
        '_e.rooms as rooms_number',
        Database.raw(
          `to_char(expiration_date + time '23:59:59', '${ISO_DATE_FORMAT}') as available_end_at`
        ),
        Database.raw(`CASE 
          WHEN _e.vacant_from IS NULL and (_e.vacant_from_string = 'sofort' OR _e.vacant_from_string = 'nach Absprache')
          THEN 'today' 
          ELSE _e.vacant_from
          END
          as vacant_date`),
        '_e.*'
      )
      .select(Database.raw(`coalesce(_l.like_count, 0)::int as like_count`))
      .select(Database.raw(`coalesce(_d.dislike_count, 0)::int as dislike_count`))
      .select(Database.raw(`coalesce(_k.knock_count, 0)::int as knocked_count`))
      .leftJoin(
        Database.raw(`(
        select 
          third_party_offer_id,
          count(case when liked then 1 end) as like_count
        from third_party_offer_interactions
        group by
          third_party_offer_id
      ) _l`),
        '_l.third_party_offer_id',
        '_e.id'
      )
      .leftJoin(
        Database.raw(`(
        select 
          third_party_offer_id,
          count(case when liked=false then 1 end) as dislike_count
        from third_party_offer_interactions
        group by
          third_party_offer_id
      ) _d`),
        '_d.third_party_offer_id',
        '_e.id'
      )
      .leftJoin(
        Database.raw(`(
        select 
          third_party_offer_id,
          count(case when knocked=true then 1 end) as knock_count
        from third_party_offer_interactions
        group by
          third_party_offer_id
      ) _k`),
        '_k.third_party_offer_id',
        '_e.id'
      )
      .leftJoin(Database.raw(`third_party_offer_interactions tpoi`), function () {
        this.on('tpoi.third_party_offer_id', '_e.id').on('tpoi.user_id', userId)
      })
      .where('tenants.user_id', userId)
    if (id) {
      query.with('point').where('_e.id', id)
    } else {
      query.where('_e.status', STATUS_ACTIVE).whereNull('tpoi.id')
    }
    if (exclude.length > 0) {
      query.whereNotIn('_e.id', exclude)
    }
    return query
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
    const { like, dislike, knock } = filter
    let query = ThirdPartyOffer.query().select(
      'third_party_offers.status as estate_status',
      'third_party_offers.price as net_rent',
      'third_party_offers.floor_count as number_floors',
      'third_party_offers.rooms as rooms_number',
      Database.raw(
        `to_char(expiration_date + time '23:59:59', '${ISO_DATE_FORMAT}') as available_end_at`
      ),
      Database.raw(`CASE 
          WHEN third_party_offers.vacant_from IS NULL and (third_party_offers.vacant_from_string = 'sofort' OR third_party_offers.vacant_from_string = 'nach Absprache')
          THEN 'today' 
          ELSE third_party_offers.vacant_from
          END
          as vacant_date`),
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
