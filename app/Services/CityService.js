'use strict'

const { GLOBAL_CACHE_CITY, GLOBAL_CACHE_KEY } = require('../constants')
const DataStorage = use('DataStorage')
const City = use('App/Models/City')

class CityService {
  static async get(id) {
    return await City.query().where('id', id).first()
  }
  static async getAll() {
    let cities = await DataStorage.getItem(GLOBAL_CACHE_KEY, GLOBAL_CACHE_CITY)
    if (!cities) {
      cities = (await City.query().fetch()).toJSON()
      await DataStorage.setItem(GLOBAL_CACHE_KEY, { cities }, GLOBAL_CACHE_CITY)
    } else {
      cities = cities.cities
    }
    return cities
  }
}

module.exports = CityService
