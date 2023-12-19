'use strict'

const HttpException = require('../../Exceptions/HttpException')

const MarketPlaceService = use('App/Services/MarketPlaceService')
const Database = use('Database')

class MarketPlaceController {
  async createContact({ request, auth, response }) {
    const { ...contact } = request.all()
    try {
      response.res(await MarketPlaceService.createContact(contact))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async createKnock({ request, auth, response }) {
    const { data1, data2 } = request.all()
    const trx = await Database.beginTransaction()
    try {
      await MarketPlaceService.createPendingKnock({ user: auth.user, data1, data2 }, trx)
      await MarketPlaceService.createKnock(
        { user: auth.user, data1, data2, email_verified: false },
        trx
      )
      await trx.commit()

      MarketPlaceService.sendBulkKnockWebsocket(auth.user.id)
      response.res(true)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  async inviteByLandlord({ request, auth, response }) {
    const { id } = request.all()
    try {
      response.res(await MarketPlaceService.inviteByLandlord({ id, user: auth.user }))
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async sendMessageToMarketplaceProspect({ request, auth, response }) {
    const { id, message } = request.all()
    try {
      response.res(
        await MarketPlaceService.sendMessageToMarketplaceProspect({
          contactRequestId: id,
          message,
          landlordId: auth.user.id
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }

  async getMessagesToMarketplaceProspect({ request, auth, response }) {
    const { id } = request.all()
    const landlordId = auth.user.id
    try {
      response.res(
        await MarketPlaceService.getMessagesToMarketplaceProspect({
          landlordId,
          contactRequestId: id
        })
      )
    } catch (e) {
      throw new HttpException(e.message, 400)
    }
  }
}

module.exports = MarketPlaceController
