'use strict'

const Database = use('Database')
const pGist = require('knex-postgis')

const Estate = use('App/Models/Estate')

class EstateController {
  /**
   *
   */
  async createEstate({ request, auth, response }) {
    const { coord, ...data } = request.all()
    const st = pGist(Database)
    const [lat, lon] = coord.split(',')
    const point = st.makePoint(lon, lat)

    const est = new Estate()
    est.fill({
      ...data,
      coord: point,
    })

    est.save()
    //
    // if (coord) {
    // }

    return 'done'
  }

  /**
   *
   */
  async updateEstate({ request, response }) {
    // TODO: estate
  }
}

module.exports = EstateController
