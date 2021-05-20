const simplify = require('simplify-js')

const GeoAPI = use('GeoAPI')
const Logger = use('Logger')
const Database = use('Database')
const Point = use('App/Models/Point')
const AppException = use('App/Exceptions/AppException')

const { isString, isArray, toNumber, range, get } = require('lodash')
const {
  POINT_TYPE_POI,
  POINT_TYPE_ZONE,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
} = require('../constants')

const MAX_TIME_DIST = 3600

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
   * Get Isoline data from GeoAPI service
   */
  static async createIsoline({ lat, lon }, distType, distMin) {
    let mode
    switch (distType) {
      case TRANSPORT_TYPE_SOCIAL:
        mode = 'approximated_transit'
        break
      case TRANSPORT_TYPE_CAR:
        mode = 'drive'
        break
      case TRANSPORT_TYPE_WALK:
        mode = 'walk'
        break
      default:
        throw new Error('Invalid mode')
    }
    // Simplify polygon to ~300 points
    const filterPoints = (points) => {
      const getTolerance = (c) => 0.00000000004 * c * c - 0.000000009 * c
      const pointsCount = points.length
      const zone = points.map(([x, y]) => ({ x, y }))
      let poly = simplify(zone, getTolerance(pointsCount), false)
      if (poly.length > 400) {
        poly = simplify(zone, getTolerance(pointsCount * 2), false)
      }

      return [[poly.map(({ x, y }) => [x, y])]]
    }

    try {
      // Time distance in sec
      const range = Math.min(+distMin * 60 || MAX_TIME_DIST, MAX_TIME_DIST)
      const data = await GeoAPI.getIsoline(lat, lon, mode, range)
      const geo = get(data, 'features.0.geometry.coordinates') || []
      // await File.logFile({ geo })
      // const data = await File.readLog()
      // const { geo } = JSON.parse(data)
      return filterPoints(get(geo, '0.0', []))
    } catch (e) {
      Logger.error(e)
      throw e
    }
  }

  /**
   *
   */
  static async getOrCreatePoint({ lat, lon }) {
    lat = Point.round(lat)
    lon = Point.round(lon)
    const point = await Point.query()
      .where('lat', lat)
      .where('lon', lon)
      .where('type', POINT_TYPE_POI)
      .first()
    if (point) {
      return point
    }

    return this.createPoint({ lat, lon })
  }

  /**
   *
   */
  static getPointsQuery(rawIsoline) {
    const points = get(rawIsoline, '0.0')
    if (isArray(points) && points.length) {
      const polyStr = [...points, points[0]].map(([lon, lat]) => `${lon} ${lat}`).join(',')
      return Database.raw(`(SELECT 'SRID=4326;POLYGON((${polyStr}))'::geometry)`)
    }

    return null
  }

  /**
   *
   */
  static async getOrCreateIsoline({ lat, lon }, distType, distMin) {
    lat = Point.round(lat)
    lon = Point.round(lon)
    const point = await Point.query()
      .where({
        lat,
        lon,
        type: POINT_TYPE_ZONE,
        dist_type: distType,
        dist_min: distMin,
      })
      .first()

    if (point) {
      return point
    }

    const polygon = await this.createIsoline({ lat, lon }, distType, distMin)
    const newPoint = new Point()
    newPoint.fill({
      lat,
      lon,
      dist_type: distType,
      dist_min: distMin,
      type: POINT_TYPE_ZONE,
      data: { data: polygon },
      zone: GeoService.getPointsQuery(polygon),
    })
    await newPoint.save()

    return newPoint
  }

  /**
   *
   */
  static async getBuildQualityAutosuggest(address, size = 5) {
    const [all, street, buildNum, separator, zip] = address.match(
      /^([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)]*)\s*(\d*)(,?)\s?(\d*)/i
    )

    const getAddr = (street, buildNum, zip, city = false) => {
      return (
        street +
        ' ' +
        (buildNum ? `${buildNum},` : '') +
        (zip ? ` ${zip}` : '') +
        (city ? ` ${city}` : '')
      )
    }

    const q = `${street}`.trim() + '%'
    const query = Database.raw(
      `SELECT *
       FROM (
         SELECT * FROM build_qualities as _b2
         WHERE _b2.id IN (
           SELECT MIN(id)
           FROM build_qualities AS _b
           WHERE
             _b.name ILIKE ?
           GROUP BY _b.name
         )
       ) as _g1
       LIMIT ?
      `,
      [q, size]
    )

    const items = (await query).rows
    if (items.length === 0) {
      return false
    }

    if (zip) {
      if (zip.length === 5) {
        return [{ name: getAddr(items[0].name, buildNum, zip, 'Berlin'), last: true }]
      } else {
        return [
          { name: getAddr(items[0].name, buildNum, zip), last: false },
          ...items[0].zip
            .map((i) => ({ name: getAddr(items[0].name, buildNum, i, 'Berlin'), last: true }))
            .slice(0, size - 1),
        ]
      }
    }

    if (separator) {
      return items[0].zip
        .map((i) => ({ name: getAddr(items[0].name, buildNum, i, 'Berlin'), last: true }))
        .slice(0, size)
    }

    if (buildNum) {
      const result = [{ name: getAddr(items[0].name, buildNum, zip), last: true }]
      for (let i = 0; i < size - 1; i++) {
        result.push({ name: getAddr(items[0].name, `${buildNum}${i}`, zip), last: true })
      }
      return result
    }

    if (items.length === 1) {
      return range(1, size).map((i) => ({ name: getAddr(items[0].name, i, zip), last: false }))
    }

    return Object.keys(
      items.reduce(
        (n, v) => ({
          ...n,
          [v.name]: true,
        }),
        {}
      )
    ).map((name) => ({ name: getAddr(name, buildNum, zip), last: false }))
  }

  /**
   *
   */
  static async getQualityByAddress({ year, sqr, address }) {
    const [all, street, buildNum, separator, zip] = address.match(
      /^([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)]*)\s*(\d*)(,?)\s?(\d*)/i
    )

    const query = Database.select('*').from('build_qualities').where('name', street.trim())
    if (zip) {
      query.where(function () {
        this.whereRaw(`( zip::jsonb \\? ? OR zip IS NULL)`, [zip])
      })
    }

    const numInclude = (num, item) => {
      item = toNumber(item)
      if (!isString(num)) {
        return false
      }

      return !!num
        .split(';')
        .map((i) => i.split(','))
        .find(([a, b]) => {
          return toNumber(a) <= item && toNumber(b) >= item
        })
    }

    const result = await query
    if (result.length === 1) {
      return result[0].quality
    } else if (result.length > 1) {
      const item = result.find((i) => i.zip === null || numInclude(i.build_num, buildNum))
      if (item) {
        return item.quality
      }

      return result[0].quality
    }

    if (result.length === 0) {
      if (!zip) {
        throw new AppException('Invalid address')
      } else {
        const nonPreciseResult = await Database.select('*').from('build_qualities').limit(1)
        if (nonPreciseResult) {
          return nonPreciseResult.query()
        }

        throw new AppException('Invalid address')
      }
    }
  }

  /**
   *
   */
  static async geeGeoCoordByAddress(address) {
    return GeoAPI.getAddressSuggestions(address)
  }

  /**
   * Distance between 2 points in meter units
   */
  static getPointsDistance(lat1, lon1, lat2, lon2) {
    const toRad = (Value) => (Value * Math.PI) / 180
    const R = 6371 // km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    lat1 = toRad(lat1)
    lat2 = toRad(lat2)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c * 1000
  }
}

module.exports = GeoService
