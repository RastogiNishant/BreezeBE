const {
  COUNTRIES,
  RENT_DURATION_LONG,
  RENT_DURATION_SHORT,
  STATUS_ACTIVE,
} = require('../constants')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')
const Estate = use('App/Models/Estate')

const Database = use('Database')
const City = use('App/Models/City')

class CommonService {
  /**
   *
   */
  static async searchProfession(query) {
    const MAX_ITEMS = 5
    const subquery = Database.from('professions')
      .select('type')
      .where('title_en', 'ILIKE', `${query}%`)
      .orWhere('title_de', 'ILIKE', `${query}%`)
      .limit(MAX_ITEMS)

    return Database.from('professions').whereIn('type', subquery).limit(MAX_ITEMS)
  }

  static async searchCities(city, country_code) {
    const cities = await City.query()
      .select('city')
      .where('alpha2', country_code)
      .where('city', 'ilike', `${city}%`)
      .limit(10)
      .orderBy('city', 'asc')
      .fetch()
    return cities.toJSON().map((city) => city.city)
  }

  static async getOffers({ rent_max, country_code, city, duration }, page = 1, limit = 20) {
    const country = COUNTRIES.filter((country) => country.country_code === country_code)
    const breezeOffersQuery = Estate.query()
      .whereIn('country', [country[0].country, country[0].other_name])
      .where('city', 'ilike', city)
      .where('net_rent', '<=', rent_max)
      .where('status', STATUS_ACTIVE)
      .select('id')
      .select('net_rent')
      .select('rooms_number')
      .select('floor')
      .select('area')
      .select('number_floors')
      .select('cover')
      .select(
        Database.raw(
          `case when full_address = true then initcap(address) else concat("zip", ' ', "city") end as address`
        )
      )
      .select(Database.raw(`'breeze' as source`))
    if (duration === RENT_DURATION_SHORT) {
      breezeOffersQuery.whereNotNull('rent_end_at').select(Database.raw(`'short' as duration`))
    } else {
      breezeOffersQuery.whereNull('rent_end_at').select(Database.raw(`'long' as duration`))
    }
    let breezeOffers = await breezeOffersQuery.fetch()
    breezeOffers = breezeOffers.toJSON()

    const thirdPartyOffersQuery = ThirdPartyOffer.query()
      .whereIn('country', [country[0].country, country[0].other_name])
      .where('city', 'ilike', city)
      .where('net_rent', '<=', rent_max)
      .where('status', STATUS_ACTIVE)
      .select('id')
      .select('source')
      .select('net_rent')
      .select('rooms_number')
      .select('floor')
      .select('area')
      .select('number_floors')
      .select(Database.raw(`images->0->'picture'->'picture_url' as cover`))
      .select(
        Database.raw(
          `case when full_address = true then initcap(address) else concat("zip", ' ', "city") end as address`
        )
      )
      .limit(10)
    if (duration === RENT_DURATION_SHORT) {
      thirdPartyOffersQuery.whereNotNull('rent_end_at').select(Database.raw(`'short' as duration`))
    } else {
      thirdPartyOffersQuery.whereNull('rent_end_at').select(Database.raw(`'long' as duration`))
    }
    let thirdPartyOffers = await thirdPartyOffersQuery.fetch()
    thirdPartyOffers = thirdPartyOffers.toJSON()
    const allOffers = [...breezeOffers, ...thirdPartyOffers]
    const total = allOffers.length
    return {
      page,
      total_pages: Math.ceil(total / limit),
      total,
      offers: allOffers.slice((page - 1) * limit, page * limit),
    }
  }
}

module.exports = CommonService
