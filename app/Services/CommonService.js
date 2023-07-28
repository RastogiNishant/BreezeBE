const {
  COUNTRIES,
  RENT_DURATION_LONG,
  RENT_DURATION_SHORT,
  STATUS_ACTIVE,
  CITIES_AUTOCOMPLETE_MAX_COUNT,
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
      .limit(CITIES_AUTOCOMPLETE_MAX_COUNT)
      .orderBy('city', 'asc')
      .fetch()
    // city% should come first than %city%
    let citiesToReturn = cities.toJSON().map((city) => city.city)
    if (citiesToReturn.length < CITIES_AUTOCOMPLETE_MAX_COUNT) {
      const additionalCities = await City.query()
        .select('city')
        .where('alpha2', country_code)
        .where('city', 'ilike', `%${city}%`)
        .whereNotIn('city', citiesToReturn)
        .limit(CITIES_AUTOCOMPLETE_MAX_COUNT - citiesToReturn.length)
        .orderBy('city', 'asc')
        .fetch()
      citiesToReturn = [...citiesToReturn, ...additionalCities.toJSON().map((city) => city.city)]
    }
    return citiesToReturn
  }

  static async getOfferCount({ rent_max, country_code, city, duration }, table) {
    let query
    if (table === 'estates') {
      query = Estate.query()
    } else if (table === 'third_party_offers') {
      query = ThirdPartyOffer.query()
    }
    query
      .whereIn('country', CommonService.getCountryAndOtherName(country_code))
      .where('city', 'ilike', city)
      .where('net_rent', '<=', rent_max)
      .where('status', STATUS_ACTIVE)
    if (duration === RENT_DURATION_SHORT) {
      query.whereNotNull('rent_end_at')
    } else if (duration === RENT_DURATION_LONG) {
      query.whereNull('rent_end_at')
    }
    const result = await query.count('* as total')
    return result?.[0]?.total || 0
  }

  static getCountryAndOtherName(country_code) {
    const countries = COUNTRIES.filter((country) => country.country_code === country_code)
    return [countries[0].country, countries[0].other_name]
  }

  static async getBreezeOffers({ rent_max, country_code, city, duration }, page = 1, limit = 20) {
    const breezeOffersQuery = Estate.query()
      .whereIn('country', CommonService.getCountryAndOtherName(country_code))
      .where('city', 'ilike', city)
      .where('net_rent', '<=', rent_max)
      .where('status', STATUS_ACTIVE)
      .select('id')
      .select('net_rent')
      .select('rooms_number')
      .select('floor')
      .select('area')
      .select('number_floors')
      .select(Database.raw('bathrooms_number'))
      .select('bedrooms_number')
      .select('wc_number')
      .select('cover')
      .select(
        Database.raw(
          `case when full_address = true then initcap(address) else concat("zip", ' ', "city") end as address`
        )
      )
      .select(Database.raw(`'breeze' as source`))
    if (duration === RENT_DURATION_SHORT) {
      breezeOffersQuery.whereNotNull('rent_end_at').select(Database.raw(`'short' as duration`))
    } else if (duration === RENT_DURATION_LONG) {
      breezeOffersQuery.whereNull('rent_end_at').select(Database.raw(`'long' as duration`))
    }
    let breezeOffers = await breezeOffersQuery.paginate(page, limit)
    return breezeOffers.toJSON().data
  }

  static async getThirdPartyOffers(
    { rent_max, country_code, city, duration },
    from = 1,
    limit = 20
  ) {
    const thirdPartyOffersQuery = ThirdPartyOffer.query()
      .whereIn('country', CommonService.getCountryAndOtherName(country_code))
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
      .select(Database.raw('bathrooms as bathrooms_number'))
      .select(Database.raw(`images->0->'picture'->'picture_url' as cover`))
      .select(
        Database.raw(
          `case when full_address = true then initcap(address) else concat("zip", ' ', "city") end as address`
        )
      )
      .offset(from)
      .limit(limit)
    if (duration === RENT_DURATION_SHORT) {
      thirdPartyOffersQuery.whereNotNull('rent_end_at').select(Database.raw(`'short' as duration`))
    } else {
      thirdPartyOffersQuery.whereNull('rent_end_at').select(Database.raw(`'long' as duration`))
    }
    let thirdPartyOffers = await thirdPartyOffersQuery.fetch()
    return thirdPartyOffers.rows
  }

  static async getOffers({ rent_max, country_code, city, duration }, page = 1, limit = 20) {
    let offers = []
    let totalCount = 0
    const fromBreezeCount = await CommonService.getOfferCount(
      { rent_max, country_code, city, duration },
      'estates'
    )
    const fromThirdPartyOfferCount = await CommonService.getOfferCount(
      { rent_max, country_code, city, duration },
      'third_party_offers'
    )
    totalCount = parseInt(fromBreezeCount) + parseInt(fromThirdPartyOfferCount)
    let enoughOfInsideMatch = false
    const offsetCount = fromBreezeCount % limit
    const insidePage = Math.ceil(fromBreezeCount / limit) || 1
    if ((page - 1) * limit < fromBreezeCount) {
      offers = await CommonService.getBreezeOffers(
        { rent_max, country_code, city, duration },
        page,
        limit
      )
      if (offers.length >= limit) {
        enoughOfInsideMatch = true
      }
    }
    if (!enoughOfInsideMatch) {
      let from = (page - insidePage) * limit - offsetCount
      if (from < 0) from = 0
      const to = (page - insidePage) * limit - offsetCount < 0 ? limit - offsetCount : limit
      const thirdPartyOffers = await CommonService.getThirdPartyOffers(
        { rent_max, country_code, city, duration },
        from,
        to
      )
      offers = [...offers, ...thirdPartyOffers]
    }
    const total = totalCount
    return {
      page,
      total_pages: Math.ceil(total / limit),
      total,
      offers,
    }
  }
}

module.exports = CommonService
