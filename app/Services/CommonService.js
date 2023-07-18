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
}

module.exports = CommonService
