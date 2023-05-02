'use_strict'

const HttpException = require('../../Exceptions/HttpException')

const EstateSyncService = use('App/Services/EstateSyncService')

class WebhookController {
  async estateSync({ request, response }) {
    const { k, eventName, eventPayload } = request.all()
    if (k !== process.env.ESTATE_SYNC_WEBHOOK_KEY) {
      throw new HttpException('Unauthorized', 400)
    }
    switch (eventName) {
      case 'property.processing_succeeded':
        await EstateSyncService.propertyProcessingSucceeded(eventPayload)
        break
      case 'publication.succeeded':
        await EstateSyncService.publicationSucceeded(eventPayload)
        break
      case 'publication.failed':
        await EstateSyncService.publicationFailed(eventPayload)
        break
      case 'request.created':
        await EstateSyncService.requestCreated(eventPayload)
        break
    }
    response.res({ eventName, eventPayload })
  }
}

module.exports = WebhookController
