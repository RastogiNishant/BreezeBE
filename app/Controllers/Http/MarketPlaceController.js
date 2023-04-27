'use strict'

const HttpException = require('../../Exceptions/HttpException')

const MarketPlaceService = use('App/Services/MarketPlaceService')
const Database = use('Database')

class MarketPlaceController {
  async createContact({ request, auth, response }) {
    const { ...contact } = request.all()
    response.res(await MarketPlaceService.createContact(contact))
  }

  async createKnock({ request, auth, response }) {
    const { data1, data2 } = request.all()
    const trx = await Database.beginTransaction()
    try {
      await MarketPlaceService.createPendingKnock({ user: auth.user, data1, data2 }, trx)
      await MarketPlaceService.createKnock({ user_id: auth.user.id }, trx)
      await trx.commit()

      await sendBulkKnockWebsocket(auth.user.id)
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = MarketPlaceController
