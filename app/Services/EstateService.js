'use strict'
const Database = use('Database')
const Estate = use('App/Models/Estate')

const { STATUS_DRAFT } = require('../constants')

class EstateService {
  /**
   *
   */
  static async createEstate({ coord, ...data }, userId) {
    const [lat, lon] = String(coord).split(',')
    let point = null
    if (lat && lon) {
      point = Database.gis.makePoint(lon, lat)
    }

    return Estate.createItem({
      ...data,
      coord: point,
      user_id: userId,
      status: STATUS_DRAFT,
    })
  }

  /**
   *
   */
  static async getEstates(filters) {
    return Estate.query().select('*', Database.gis.asGeoJSON('coord')).fetch()
  }
}

module.exports = EstateService
