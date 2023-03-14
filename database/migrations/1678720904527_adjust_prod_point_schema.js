'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Point = use('App/Models/Point')
const GeoService = use('App/Services/GeoService')

class AdjustProdPointSchema extends Schema {
  async up() {
    const points = (
      await Point.query()

        .whereIn(
          'id',
          [
            3711, 651, 2618, 700, 2533, 942, 1169, 1821, 1824, 1652, 1897, 2024, 2039, 2076, 2920,
            2614, 2699, 2774, 3146, 3792,
          ]
        )
        .fetch()
    ).rows

    let i = 0
    while (i < points.length) {
      const point = points[i]
      const polygon = await GeoService.createIsoline(
        { lat: point.lat, lon: point.lon },
        point.dist_type,
        point.dist_min
      )
      const zone = GeoService.getPointsQuery(polygon)
      point.zone = zone
      await point.save()
      i++
    }
  }

  down() {
    this.table('adjust_prod_points', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustProdPointSchema
