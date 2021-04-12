const GeoAPI = use('GeoAPI')
const Logger = use('Logger')
const Point = use('App/Models/Point')

class GeoService {
  /**
   *
   */
  static async createPoint({ lat, lon }) {
    const point = new Point()
    point.fill({ lat, lon })

    let data
    try {
      data = await GeoAPI.getBatchedPlaces({ lat, lon })
    } catch (e) {
      Logger.error(e)
      throw e
    }
    point.data = { data }
    await point.save()

    return point
  }

  /**
   *
   */
  static async getOrCreatePoint({ lat, lon }) {
    const point = await Point.query()
      .where('lat', Point.round(lat))
      .where('lon', Point.round(lon))
      .first()
    if (point) {
      return point
    }

    return this.createPoint({ lat, lon })
  }
}

module.exports = GeoService
