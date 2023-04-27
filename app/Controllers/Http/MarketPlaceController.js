'use strict'
const MarketPlaceService = use('App/Services/MarketPlaceService')

class MarketPlaceController {
  async createContact({ request, auth, response }) {
    const { ...contact } = request.all()
    response.res(await MarketPlaceService.createContact(contact))
  }
}

module.exports = MarketPlaceController
