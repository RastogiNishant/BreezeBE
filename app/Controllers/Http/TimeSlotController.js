'use strict'

const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const HttpException = use('App/Exceptions/HttpException')
const File = use('App/Classes/File')

const { MATCH_STATUS_VISIT, MATCH_STATUS_SHARE } = require('../../constants')

class TimeSlotController {
  async getUpcomingShows({ request, auth, response }) {
    const { page, limit, query } = request.all()
    const userId = auth.user.id
    try {
      // const result = await EstateService.getUpcomingShows(query)
      // .select('time_slots.*')
      // .select('_e.*')
      // .select('_u.email', '_u.phone')
      // .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      // .innerJoin({ _m: 'matches' }, function () {
      //    this.on('_m.estate_id', '_e.id').onIn('_m.status', [MATCH_STATUS_VISIT, MATCH_STATUS_SHARE])
      //  })
      // .innerJoin({ _u: 'users' }, '_e.user_id', '_u.id')
      // .innerJoin({ _v: 'visits' }, function () {
      //    this.on('_v.user_id', '_m.user_id').on('_v.estate_id', '_m.estate_id')
      //  })
      // .where('_e.user_id', userId)
      // .where('start_at', '>', Database.fn.now())
      // .orderBy('start_at', 'asc')
      // .paginate(page, limit)

      const result = await EstateService.getUpcomingShows([userId], query).paginate(page, limit)

      return response.res(result)
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = TimeSlotController
