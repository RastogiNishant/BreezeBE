'use_strict'

const HttpException = require('../../../Exceptions/HttpException')
const { ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE } = require('../../../constants')
const {EstateSync} = use('App/Classes/EstateSync')
const EstateSyncTarget = use('App/Models/EstateSyncTarget')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')

class EstateSyncController {
  async initialize({ request, response }) {
    const alreadyInitialized = await EstateSyncCredential.query()
      .whereNull('user_id')
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE)
      .first()

    if (alreadyInitialized) {
      throw new HttpException('EstateSync setup was already done.')
    }
    const { contact, is24key, is24secret } = request.all()
    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
    const is24result = await estateSync.put('account/credentials/immobilienscout-24', {
      key: is24key,
      secret: is24secret
    })
    if (is24result.success) {
      const contactResult = await estateSync.post('contacts', contact)
      if (contactResult.success) {
        await EstateSyncCredential.createItem({
          type: ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
          estate_sync_contact_id: contactResult.data.id
        })
      }
    }
    return response.res(request.all())
  }

  async addTarget({ request, response }) {
    const { type, credentials } = request.all()
    const breezeEstateSync = await EstateSyncCredential.query()
      .whereNull('user_id')
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE)
      .first()
    const existingTarget = await EstateSyncTarget.query()
      .where('publishing_provider', type)
      .where('estate_sync_credential_id', breezeEstateSync.id)
      .first()

    if (existingTarget) {
      throw new HttpException(
        'We only allow single target for each type. Please delete existing target.'
      )
    }
    let data
    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
    switch (type) {
      case 'immowelt':
      case 'ebay-kleinanzeigen':
        data = {
          type,
          credentials
        }
        if (type === 'immowelt') {
          data['autoCollectRequests'] = true
        }
        break
      case 'immobilienscout-24':
        data = {
          type: 'immobilienscout-24',
          redirectUrl: process.env.ESTATE_SYNC_IS24_OAUTH_TOKEN_REDIRECT,
          autoCollectRequests: true
        }
        break
      default:
        break
    }
    try {
      const result = await estateSync.post('targets', data)
      if (result?.success) {
        await EstateSyncTarget.createItem({
          estate_sync_credential_id: breezeEstateSync.id,
          publishing_provider: type,
          estate_sync_target_id: result.data.id
        })
        return response.res(result.data)
      } else {
        throw new HttpException(result.data.message, 400)
      }
    } catch (err) {
      throw new HttpException(err.message)
    }
  }

  async getTargets({ response }) {
    const targets = await EstateSyncTarget.query().fetch()
    return response.res({ targets })
  }

  async deleteTarget({ request, response }) {
    const { id } = request.all()
    const target = await EstateSyncTarget.query().where('id', id).first()
    if (!target) {
      throw new HttpException('Target not found.')
    }
    try {
      const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
      const estateSyncResult = await estateSync.delete(target.estate_sync_target_id, 'targets')
      if (estateSyncResult) {
        const result = await EstateSyncTarget.query().where('id', id).delete()
        return response.res(result > 0)
      }
    } catch (err) {
      console.log(err)
      throw new HttpException(err.message)
    }
  }
}

module.exports = EstateSyncController
