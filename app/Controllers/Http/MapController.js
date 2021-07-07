const { get } = require('lodash')
const Database = use('Database')
const Tenant = use('App/Models/Tenant')

class MapController {
  /**
   *
   */
  async getMap({ request, view, response }) {
    const { userId = 10 } = request.all()
    const tenants = await Database.table('tenants')
      .select('tenants.id', '_p.lat', '_p.lon', '_p.data')
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .limit(100)
    const zone = get(tenants, '0.data.data.0.0', null)

    const estates = await Database.query()
      .from('estates')
      .select('estates.coord_raw', '_m.estate_id as id')
      .leftJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', +userId)
      })
    //
    // const data = estates.reduce((n, v) => {
    //   if (!v.coord_raw) {
    //     return n
    //   }
    //   const [lat, lng] = v.coord_raw.split(',')
    //   return [...n, { lat, lng, isIn: !!v.id }]
    // }, [])
    const data = []

    return view.render('map', {
      points: JSON.stringify(data),
      zone: JSON.stringify(zone),
      tenants: JSON.stringify(tenants),
    })
  }
}

module.exports = MapController
