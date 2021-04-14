const GeoAPI = use('GeoAPI')
const Logger = use('Logger')
const Database = use('Database')
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

  /**
   *
   */
  static async getBuildQualityAutosuggest({ street, buildNum, separator, zip }, size = 5) {
    const getAddr = (street, buildNum, zip) => {
      return street + ' ' + (buildNum ? `${buildNum},` : '') + (zip ? ` ${zip}` : '')
    }

    const q = `${street}`.trim() + '%'
    const query = Database.raw(
      `SELECT * FROM (
        SELECT *
        FROM build_qualities AS _b
          CROSS JOIN (
            SELECT COUNT(*)
            FROM (SELECT DISTINCT (region_id)
                  FROM build_qualities
                  WHERE name ILIKE ?
                  GROUP BY region_id) AS _t1
          ) AS _t
        WHERE
          _b.name ILIKE ?
        ) as _g1 LIMIT ?
      `,
      [q, q, size]
    )

    //Adolfstraße

    const items = (await query).rows
    if (items.length === 0) {
      return false
    }

    if (zip) {
      if (zip.length === 5) {
        return [{ name: getAddr(items[0].name, buildNum, zip), last: true }]
      } else {
        return [
          { name: getAddr(items[0].name, buildNum, zip), last: false },
          ...items[0].zip
            .map((i) => [{ name: getAddr(items[0].name, buildNum, i), last: true }])
            .slice(0, size - 1),
        ]
      }
    }

    if (separator) {
      return items[0].zip
        .map((i) => [{ name: getAddr(items[0].name, buildNum, i), last: true }])
        .slice(0, size)
    }

    if (buildNum) {
      const isLast = parseInt(items[0].count) === 1
      const result = [{ name: getAddr(items[0].name, buildNum, zip), last: isLast }]
      for (let i = 0; i < size - 1; i++) {
        result.push([{ name: getAddr(items[0].name, `${buildNum}${i}`, zip), last: isLast }])
      }
      return result
    }

    if (items.length === 1) {
      return [{ name: getAddr(items[0].name, buildNum, zip), last: true }]
    } else {
      return Object.keys(
        items.reduce(
          (n, v) => ({
            ...n,
            [v.name]: true,
          }),
          {}
        )
      ).map((name) => [{ name: getAddr(name, buildNum, zip), last: false }])
    }
  }
}

module.exports = GeoService
