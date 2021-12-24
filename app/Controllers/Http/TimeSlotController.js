'use strict'

const TimeSlot = use('App/Models/TimeSlot')
const Database = use('Database')

class TimeSlotController {

  async getUpcomingShows({ request, auth, response }) {

      const { query } = request.all()
      const userId = auth.user.id
      const slots = await TimeSlot.query().with('user')
      .whereHas('user', (estateQuery) => {
            if(query?.length > 0) {
                  estateQuery.where('address', 'ILIKE', `%${query}%`)
            }
      })
      .select('time_slots.*')
      .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      .where('_e.user_id', userId)
      .where('time_slots.start_at', '>', Database.fn.now())
      .orderBy('start_at', 'asc')
      .fetch()
      return response.res(slots)

   }

}

module.exports = TimeSlotController
