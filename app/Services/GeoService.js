const GeoAPI = use('GeoAPI')
const Logger = use('Logger')
const Database = use('Database')
const Point = use('App/Models/Point')
const AppException = use('App/Exceptions/AppException')

const { isString, toNumber, range } = require('lodash')
const { POINT_TYPE_POI } = require('../constants')

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
  static async getOrCreatePoint({ lat, lon }, type = POINT_TYPE_POI) {
    lat = Point.round(lat)
    lon = Point.round(lon)
    const point = await Point.query()
      .where('lat', lat)
      .where('lon', lon)
      .where('type', type)
      .first()
    if (point) {
      return point
    }

    return this.createPoint({ lat, lon })
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
}

module.exports = GeoService
