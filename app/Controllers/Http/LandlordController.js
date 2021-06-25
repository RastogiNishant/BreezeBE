'use strict'

const LandlordService = use('App/Services/LandlordService')

class LandlordController {
  /**
   *
   */
  async getLordVisits({ auth, response }) {
    const slots = await LandlordService.getBookedTimeslots(auth.user.id)

    response.res(slots)
  }
}

module.exports = LandlordController
