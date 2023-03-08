const axios = require('axios')
const OhneMakler = require('../Classes/OhneMakler')
const { get } = require('lodash')
const crypto = require('crypto')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const DataStorage = use('DataStorage')
const Database = use('Database')
const Promise = require('bluebird')
const { STATUS_ACTIVE } = require('../constants')
const QueueService = use('App/Services/QueueService')
const ThirdPartyOfferInteraction = use('App/Models/ThirdPartyOfferInteraction')

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
    try {
      const { data } = await axios.get(process.env.OHNE_MAKLER_API_URL, { timeout: 2000 })
      if (!data) {
        throw new Error('Error found on pulling ohne makler')
      }
      const ohneMaklerChecksum = await ThirdPartyOfferService.getOhneMaklerChecksum()
      const checksum = ThirdPartyOfferService.generateChecksum(JSON.stringify(data))
      if (checksum !== ohneMaklerChecksum) {
        //there must be some difference between the data... so we can process
        const ohneMakler = new OhneMakler(data)
        const estates = ohneMakler.process()

        await Promise.map(estates, async (estate) => {
          const found = await ThirdPartyOffer.query()
            .where('source', 'ohnemakler')
            .where('source_id', estate.source_id)
            .first()
          if (!found) {
            await ThirdPartyOffer.createItem(estate)
          } else {
            await found.updateItem(estate)
          }
        })
        this.setOhneMaklerChecksum(checksum)
        return estates
      }
    } catch (err) {
      console.log(err)
    }
  }

  static async getEstates(userId, page = 1, limit = 10) {
    let estates = await ThirdPartyOfferService.searchEstatesQuery(userId).paginate(page, limit)
    return estates
  }

  static searchEstatesQuery(userId) {
    /* estate coord intersects with polygon of tenant */
    return Database.select(Database.raw(`TRUE as inside`))
      .select('_e.*')
      .select(Database.raw(`coalesce(_l.like_count, 0)::int as like_count`))
      .select(Database.raw(`coalesce(_d.dislike_count, 0)::int as dislike_count`))
      .select(Database.raw(`coalesce(_k.knock_count, 0)::int as knock_count`))
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
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
      .where('_t.user_id', userId)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
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
        value = { third_party_offer_id: id, user_id: userId, knocked: true }
        break
      case 'contact':
        value = { third_party_offer_id: id, user_id: userId, inquiry: message }
        QueueService.contactOhneMakler({
          third_party_offer_id: id,
          userId,
          message,
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
