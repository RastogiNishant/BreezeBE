'use strict'
const Database = use('Database')
const { STATUS_ACTIVE, STATUS_DRAFT } = require('../../../constants')

const Estate = use('App/Models/Estate')

class PropertyController {
  async getProperties({ request, response }) {
    let estates = await Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw('json_agg(users) as user'))
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_DRAFT])
      .innerJoin('users', 'estates.user_id', 'users.id')
      /*.with('matches')
      .with('visits')*/
      .groupBy('estates.id')
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON()
    return response.res(estates)
  }
}

module.exports = PropertyController
