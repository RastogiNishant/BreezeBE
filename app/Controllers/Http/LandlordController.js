'use strict'

const LandlordService = use('App/Services/LandlordService')
const CompanyService = use('App/Services/CompanyService')

class LandlordController {
  /**
   *
   */
  async getLordVisits({ auth, response }) {
    const slots = await LandlordService.getBookedTimeslots(auth.user.id)

    response.res(slots)
  }

  /**
   *
   */
  async activate({ auth, response }) {
    await CompanyService.validateUserContacts(auth.user.id)

    return response.res(true)
  }
}

module.exports = LandlordController
