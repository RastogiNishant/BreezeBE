'use_strict'

const HttpException = require('../../../Exceptions/HttpException')
const { ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE } = require('../../../constants')
const EstateSync = use('App/Classes/EstateSync')
const EstateSyncTarget = use('App/Models/EstateSyncTarget')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')

class EstateSyncController {
  async addTarget({ request, response }) {
    const { type, credentials } = request.all()
    const breezeEstateSync = await EstateSyncCredential.query()
      .whereNull('user_id')
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE)
      .first()
    let data
    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
    switch (type) {
      case 'immowelt':
      case 'ebay-kleinanzeigen':
        data = {
          type,
          credentials,
        }
        if (type === 'immowelt') {
          data['autoCollectRequests'] = true
        }
        break
      case 'immobilienscout-24':
        data = {
          type: 'immobilienscout-24',
          redirectUrl: process.env.ESTATE_SYNC_IS24_OAUTH_TOKEN_REDIRECT,
          autoCollectRequests: true,
        }
        break
    }
    try {
      const result = await estateSync.post('targets', data)
      if (result.success) {
        await EstateSyncTarget.createItem({
          estate_sync_credential_id: breezeEstateSync.id,
          publishing_provider: type,
          estate_sync_target_id: result.data.id,
        })
        return response.res({ estate_sync_target_id: result.data.id })
      } else {
        throw new HttpException(result.data.message, 400)
      }
    } catch (err) {
      throw new HttpException(err.message)
    }
  }

  async getListings() {}
}

module.exports = EstateSyncController
