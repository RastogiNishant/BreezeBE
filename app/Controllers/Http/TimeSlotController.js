'use strict'

const TimeSlot = use('App/Models/TimeSlot')
const Database = use('Database')

class TimeSlotController {

  async getUpcomingShows({ request, auth, response }) {

      const { query } = request.all()
      const userId = auth.user.id

      const result = await EstateService.getUpcomingShows(query)
      .select('time_slots.*')
      .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      .where('_e.user_id', userId)
      .where('start_at', '>', Database.fn.now())
      .orderBy('start_at', 'asc')
      .with('user')
      .fetch()
      return response.res(result)

   }

}

module.exports = TimeSlotController
