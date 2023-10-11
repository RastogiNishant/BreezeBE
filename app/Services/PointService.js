'use strict'

const HttpException = require('../Exceptions/HttpException')
const { TRANSPORT_TYPE_CAR } = require('../constants')
const GeoService = use('App/Services/GeoService')
const {
  exceptions: { LAT_LON_NOT_PROVIDED }
} = require('../exceptions')

class PointService {
  static async getPointId({ coord, dist_type = TRANSPORT_TYPE_CAR, dist_min = 60 }) {
    const [lat, lon] = coord.split(',')
    if (!lat || !lon) {
      throw new HttpException(LAT_LON_NOT_PROVIDED, 400)
    }
    const point = await GeoService.getOrCreateIsoline({ lat, lon }, dist_type, dist_min)
    return point
  }
}

module.exports = PointService
