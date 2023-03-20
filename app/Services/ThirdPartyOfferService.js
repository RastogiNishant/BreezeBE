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
} = require('../constants')
const QueueService = use('App/Services/QueueService')
const EstateService = use('App/Services/EstateService')
const Tenant = use('App/Models/Tenant')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')
const {
  exceptions: { ALREADY_KNOCKED_ON_THIRD_PARTY },
} = require('../exceptions')

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

  static async pullOhneMakler() {
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
      if (checksum !== ohneMaklerChecksum) {
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

        await this.setOhneMaklerChecksum(checksum)
      }
    } catch (err) {
      console.log(err)
    }
  }

  static async getEstates(userId, limit = 10) {
    let estates = await ThirdPartyOfferService.searchEstatesQuery(userId).limit(limit).fetch()
    estates = await Promise.all(
      estates.rows.map(async (estate) => {
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
    return estates
  }

  static async getEstate(userId, third_party_offer_id) {
    let estate = await ThirdPartyOfferService.searchEstatesQuery(
      userId,
      third_party_offer_id
    ).first()
    estate['__meta__'] = {
      knocked_count: estate.knocked_count,
      like_count: estate.like_count,
      dislike_count: estate.dislike_count,
    }
    estate.rooms = null
    return estate
  }

  static searchEstatesQuery(userId, id = false) {
    /* estate coord intersects with polygon of tenant */
    let query = Tenant.query()
      .select(
        '_e.price as net_rent',
        '_e.floor_count as number_floors',
        '_e.rooms as rooms_number',
        '_e.expiration_date as available_end_at',
        '_e.vacant_from as vacant_date',
        '_e.*'
      )
      .select(Database.raw(`coalesce(_l.like_count, 0)::int as like_count`))
      .select(Database.raw(`coalesce(_d.dislike_count, 0)::int as dislike_count`))
      .select(Database.raw(`coalesce(_k.knock_count, 0)::int as knocked_count`))
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .crossJoin({ _e: 'third_party_offers' })
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
      .where('_e.status', STATUS_ACTIVE)
      .whereNull('tpoi.id')
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
    if (id) {
      query.with('point').where('_e.id', id)
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
        const knockFound = await ThirdPartyOfferInteraction.query()
          .where('third_party_offer_id', id)
          .where('user_id', userId)
          .where('knocked', true)
          .first()
        if (knockFound) {
          throw new Error(ALREADY_KNOCKED_ON_THIRD_PARTY)
        }
        value = {
          third_party_offer_id: id,
          user_id: userId,
          knocked: true,
          knocked_at: moment().utc().format(),
        }
        QueueService.contactOhneMakler({
          third_party_offer_id: id,
          userId,
          message: '',
        })
        break
    }
    if (!found) {
      await ThirdPartyOfferInteraction.createItem(value)
    } else {
      await found.updateItem(value)
    }
    return true
  }
}

module.exports = ThirdPartyOfferService
