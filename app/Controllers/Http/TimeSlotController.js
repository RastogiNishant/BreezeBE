'use strict'

const TimeSlot = use('App/Models/TimeSlot')
const Database = use('Database')

class TimeSlotController {

	async getUpcomingShows({ request, auth, response }) {

	const { limit, page } = request.all()
	const userId = auth.user.id
      console.log('jjjj', userId)
	const slots = await TimeSlot.query().with('user')
      .select('time_slots.*')
      .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      .where('_e.user_id', userId)
      .where('time_slots.start_at', '>', Database.fn.now())
      .fetch()
      return response.res(slots)

	}

}

module.exports = TimeSlotController
