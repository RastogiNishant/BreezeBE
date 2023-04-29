'use_strict'

const HttpException = require('../Exceptions/HttpException')
const {
  ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
  ESTATE_SYNC_CREDENTIAL_TYPE_USER,
  STATUS_ACTIVE,
  ROLE_USER,
  WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
  WEBSOCKET_EVENT_ESTATE_SYNC_POSTING,
  STATUS_DELETE,
  STATUS_DRAFT,
} = require('../constants')

const EstateSync = use('App/Classes/EstateSync')
const EstateService = use('App/Services/EstateService')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')
const EstateSyncTarget = use('App/Models/EstateSyncTarget')
const EstateSyncListing = use('App/Models/EstateSyncListing')
const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Ws = use('Ws')
const Database = use('Database')
const Promise = require('bluebird')
const Logger = use('Logger')
class EstateSyncService {
  static async getBreezeEstateSyncCredential() {
    const credential = await EstateSyncCredential.query()
      .whereNull('user_id')
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE)
      .first()
    credential['api_key'] = process.env.ESTATE_SYNC_API_KEY
    return credential
  }

  static async getLandlordEstateSyncCredential(user_id) {
    const credential = await EstateSyncCredential.query()
      .where('user_id', user_id)
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_USER)
      .first()
    return credential
  }

  static async saveMarketPlacesInfo({
    estate_id,
    estate_sync_property_id,
    performed_by,
    publishers,
  }) {
    let listingExists = []

    if (publishers?.length) {
      listingExists = (
        await EstateSyncListing.query()
          .where('estate_id', estate_id)
          .whereIn('provider', publishers)
          .fetch()
      ).toJSON()
    }

    const trx = await Database.beginTransaction()
    try {
      await Promise.map(
        publishers,
        async (publisher) => {
          if (listingExists.find((list) => list.provider === publisher)) {
            await EstateSyncListing.query()
              .update({
                status: estate_sync_property_id ? STATUS_ACTIVE : STATUS_DRAFT,
                performed_by,
                estate_sync_property_id,
                estate_sync_listing_id: null,
                publish_url: null,
              })
              .where('provider', publisher)
              .where('estate_id', estate_id)
              .transacting(trx)
          } else {
            await EstateSyncListing.createItem(
              {
                provider: publisher,
                estate_id,
                performed_by,
                status: estate_sync_property_id ? STATUS_ACTIVE : STATUS_DRAFT,
                estate_sync_property_id,
              },
              trx
            )
          }
        },
        { concurrency: 1 }
      )

      await EstateSyncListing.query()
        .whereNotIn('provider', publishers)
        .where('estate_id', estate_id)
        .update({
          estate_sync_property_id: null,
          status: STATUS_DELETE,
          estate_sync_listing_id: null,
          publish_url: null,
        })
        .transacting(trx)

      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async postEstate({ estate_id, performed_by, publishers }) {
    if (!estate_id) {
      return
    }

    let estate = await EstateService.getByIdWithDetail(estate_id)
    let credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
    if (!credential) {
      credential = await EstateSyncService.getBreezeEstateSyncCredential()
    }

    estate = estate.toJSON()
    const estateSync = new EstateSync(credential.api_key)
    if (!Number(estate.usable_area)) {
      estate.usable_area = estate.area
    }
    const resp = await estateSync.postEstate({
      estate,
      contactId: credential.estate_sync_contact_id,
    })

    let estate_sync_property_id = null
    let data = {
      success: true,
      type: 'success-posting',
      estate_id,
    }

    if (resp?.success) {
      estate_sync_property_id = resp.data.id
    } else {
      //POSTING ERROR. Send websocket event
      data = {
        ...data,
        success: false,
        type: 'error-posting',
        message: resp?.data?.message, //FIXME: message here could be too technical.
      }
      Logger.error(JSON.stringify({ post_estate_sync_error: resp }))
      //FIXME: replace this with logger...
      const MailService = use('App/Services/MailService')
      MailService.sendEmailToOhneMakler(JSON.stringify(resp), 'barudo@gmail.com')
    }

    try {
      await this.saveMarketPlacesInfo({
        estate_id,
        estate_sync_property_id,
        performed_by,
        publishers,
      })

      EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_SYNC_POSTING,
        user_id: estate.user_id,
        data,
      })
    } catch (e) {
      Logger.error(JSON.stringify({ save_posting_estate_sync: e.message }))
    }
  }

  static async propertyProcessingSucceeded(payload) {
    const propertyId = payload.id
    const credential = await EstateSyncService.getBreezeEstateSyncCredential()
    const listing = await EstateSyncListing.query()
      .where('estate_sync_property_id', propertyId)
      .where('status', STATUS_ACTIVE)
      .whereNull('estate_sync_listing_id')
      .first()

    if (!listing) {
      return
    }
    const target = await EstateSyncTarget.query()
      .where('publishing_provider', listing.provider)
      .where('estate_sync_credential_id', credential.id)
      .first()
    const estateSync = new EstateSync(credential.api_key)
    const resp = await estateSync.post('listings', {
      targetId: target.estate_sync_target_id,
      propertyId,
    })
    if (resp.success) {
      await listing.updateItem({ estate_sync_listing_id: result.data.id })
    } else {
      //PUBLISHING_ERROR Send websocket event
      const estate = await Estate.query().select('user_id').where('id', listing.estate_id).first()
      EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
        user_id: estate.user_id,
        data: {
          success: false,
          type: 'error-publishing',
          estate_id: listing.estate_id,
          provider: listing.provider,
          message: resp?.data?.message,
        },
      })
      //FIXME: replace this with logger...
      const MailService = use('App/Services/MailService')
      await MailService.sendEmailToOhneMakler(
        `LISTING ERR RESULT: ${JSON.stringify(result)}`,
        'barudo@gmail.com'
      )
    }
  }

  static async publicationSucceeded(payload) {
    const MailService = use('App/Services/MailService')
    await MailService.sendEmailToOhneMakler(
      `PUBLICATION payload: ${JSON.stringify(payload)}`,
      'barudo@gmail.com'
    )
    if (!payload?.listingId) {
      return
    }

    const listing = await EstateSyncListing.query()
      .where('estate_sync_listing_id', payload.listingId)
      .first()

    if (!listing) {
      return
    }

    if (payload.type === 'delete') {
      await listing.updateItem({ estate_sync_listing_id: null, publish_url: null })
    } else if (payload.type === 'set') {
      await listing.updateItem({ publish_url: payload.publicUrl })
      const estate = await Estate.query().select('user_id').where('id', listing.estate_id).first()

      /* websocket emit to landlord */
      EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
        user_id: estate.user_id,
        data: {
          success: true,
          type: 'success-publishing',
          estate_id: listing.estate_id,
          publisher: listing.provider,
          publish_url: payload.publicUrl,
        },
      })

      //call propertyProcessingSucceeded to publish unpublished properties
      await EstateSyncService.propertyProcessingSucceeded({ id: listing.estate_sync_property_id })
    }
  }

  static async requestCreated(payload) {
    if (!payload?.propertyId) {
      return
    }
    const listing = await EstateSyncListing.query()
      .where('estate_sync_property_id', payload.propertyId)
      .first()

    if (!listing) {
      return
    }

    const contactRequest = await EstateSyncContactRequest.query()
      .where('estate_id', listing.estate_id)
      .where('email', payload.prospect.email)
      .first()
    const user = await User.query()
      .where('email', payload.prospect.email)
      .where('role', ROLE_USER)
      .first()
    if (contactRequest) {
      await contactRequest.updateItem({
        email: payload.prospect.email,
        contact_info: payload.prospect,
        message: payload.message,
        user_id: user?.id || null,
      })
    } else {
      await EstateSyncContactRequest.create({
        estate_id: listing.estate_id,
        email: payload.prospect.email,
        contact_info: payload.prospect,
        message: payload.message,
        user_id: user?.id || null,
      })
      /** TODO: Send email to user with deeplink for registration */
    }
    if (user) {
      //add to matches table with estate_id=listing.estate_id, user_id: user.id
    }
  }

  static async emitWebsocketEventToLandlord({ event, user_id, data }) {
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws.getChannel(channel).topic(topicName)

    if (topic) {
      topic.broadcast(event, data)
    }
  }
}

module.exports = EstateSyncService
