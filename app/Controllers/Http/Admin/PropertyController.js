'use strict'
const Database = use('Database')
const moment = require('moment')
const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  DAY_FORMAT,
  MATCH_STATUS_INVITE,
} = require('../../../constants')

const Estate = use('App/Models/Estate')

class PropertyController {
  async getProperties({ request, response }) {
    const currentDay = moment().startOf('day')

    let estates = await Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw('json_agg(users) as user'))
      .select(Database.raw('COUNT(visits)::int as visit_count'))
      .select(Database.raw('COUNT(_i.*)::int as invite_count'))
      .whereIn('estates.status', [STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE])
      .innerJoin('users', 'estates.user_id', 'users.id')
      .leftJoin('time_slots', function () {
        this.on('estates.id', 'time_slots.estate_id')
      })
      .where('time_slots.end_at', '<=', currentDay.format(DAY_FORMAT))
      .leftJoin('visits', function () {
        this.on('visits.start_date', '>=', 'time_slots.start_at')
          .on('visits.end_date', '<=', 'time_slots.end_at')
          .on('visits.estate_id', '=', 'estates.id')
      })
      .leftJoin(Database.raw(`(select * from matches) as _i`), function () {
        this.on('_i.estate_id', 'estates.id').on('_i.status', MATCH_STATUS_INVITE)
      })
      .groupBy('time_slots.id', 'estates.id')
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON()
    return response.res(estates)
  }
}

module.exports = PropertyController
