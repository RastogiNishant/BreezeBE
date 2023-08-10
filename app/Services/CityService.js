'use strict'
const City = use('App/Models/City')

class CityService {
  static async get(id) {
    return await City.query().where('id', id).first()
  }
}

module.exports = CityService
