'use strict'
const Database = use('Database')
const Estate = use('App/Models/Estate')

const { STATUS_DRAFT, STATUS_DELETE } = require('../constants')

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
    const { limit, page, ...params } = filters
    const query = Estate.query().select('*', Database.gis.asGeoJSON('coord')).with('rooms')
    if (params.query) {
      query.where(function () {
        this.orWhere('street', 'ilike', `%${params.query}%`)
        this.orWhere('property_id', 'ilike', `${params.query}%`)
      })
    }

    if (params.status) {
      query.where('status', params.status)
    }

    return query.paginate(page, limit)
  }

  /**
   *
   */
  static async removeEstate(id) {
    // TODO: remove indexes
    return Estate.query().update({ status: STATUS_DELETE }).where('id', id)
  }
}

module.exports = EstateService
