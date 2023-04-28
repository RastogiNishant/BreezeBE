'use_strict'

const {
  ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
  ESTATE_SYNC_CREDENTIAL_TYPE_USER,
  STATUS_DRAFT,
  STATUS_ACTIVE,
  ROLE_USER,
  WEBSOCKET_EVENT_ESTATE_SYNC_SUCCESSFUL_PUBLISH,
  STATUS_DELETE,
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

  static async postEstate({ estate_id, estate_sync_property_id = null, performed_by, publishers }) {
    let estate = await EstateService.getByIdWithDetail(estate_id)
    let credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
    if (!credential) {
      credential = await EstateSyncService.getBreezeEstateSyncCredential()
    }

    if (!estate_sync_property_id) {
      estate = estate.toJSON()
      const estateSync = new EstateSync(credential.api_key)
      if (!Number(estate.usable_area)) {
        estate.usable_area = estate.area
      }
      const resp = await estateSync.postEstate({
        estate,
        contactId: credential.estate_sync_contact_id,
      })
      if (resp?.success) {
        estate_sync_property_id = resp.data.id
      }
    }

    let listings = []
    for (let i = 0; i < publishers.length; i++) {
      const listingExists = await EstateSyncListing.query()
        .where('estate_id', estate_id)
        .where('provider', publishers[i])
        .first()
      if (listingExists) {
        await listingExists.updateItem({
          status: STATUS_ACTIVE,
          performed_by,
          estate_sync_property_id,
          estate_sync_listing_id: '',
          publish_url: '',
        })
      } else {
        listings = [
          ...listings,
          {
            provider: publishers[i],
            estate_id,
            performed_by,
            status: STATUS_ACTIVE,
            estate_sync_property_id,
          },
        ]
      }
    }
    await EstateSyncListing.createMany(listings)
    await EstateSyncListing.query()
      .whereNotIn('provider', publishers)
      .where('estate_id', estate_id)
      .update({
        estate_sync_property_id: '',
        status: STATUS_DELETE,
        estate_sync_listing_id: '',
        publish_url: '',
      })
  }

  static async unpublishEstate(estate_id) {
    const listing = await EstateSyncListing.query()
      .where('estate_id', estate_id)
      .whereNotNull('estate_sync_listing_id')
      .where('status', STATUS_ACTIVE)
      .first()
    if (listing) {
      await EstateSync.delete('listings', listing.estate_sync_listing_id)
    }
  }

  static async propertyProcessingSucceeded(payload) {
    const propertyId = payload.id
    const credential = await EstateSyncService.getBreezeEstateSyncCredential()
    const listing = await EstateSyncListing.query()
      .where('estate_sync_property_id', propertyId)
      .where('status', STATUS_DRAFT)
      .first()

    if (!listing) {
      return
    }
    const target = await EstateSyncTarget.query()
      .where('publishing_provider', listing.provider)
      .where('estate_sync_credential_id', credential.id)
      .first()
    const estateSync = new EstateSync(credential.api_key)
    const result = await estateSync.post('listings', {
      targetId: target.estate_sync_target_id,
      propertyId,
    })
    if (result.success) {
      await listing.updateItem({ estate_sync_listing_id: result.data.id, status: STATUS_ACTIVE })
    }
  }

  static async publicationSucceeded(payload) {
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
      await EstateSyncService.unpublishEstate(listing.estate_id)
    } else if (payload.type === 'set') {
      await listing.updateItem({ publish_url: payload.publicUrl })
      const estate = await Estate.query().select('user_id').where('id', listing.estate_id).first()

      /* websocket emit to landlord */
      await EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_SYNC_SUCCESSFUL_PUBLISH,
        user_id: estate.user_id,
        data: {
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
