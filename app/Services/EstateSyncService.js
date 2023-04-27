'use_strict'

const {
  ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
  ESTATE_SYNC_CREDENTIAL_TYPE_USER,
  STATUS_DRAFT,
  STATUS_ACTIVE,
} = require('../constants')

const EstateSync = use('App/Classes/EstateSync')
const EstateService = use('App/Services/EstateService')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')
const EstateSyncTarget = use('App/Models/EstateSyncTarget')
const EstateSyncListing = use('App/Models/EstateSyncListing')

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
      listings = [
        ...listings,
        {
          provider: publishers[i],
          estate_id,
          performed_by,
          status: STATUS_DRAFT,
          estate_sync_property_id,
        },
      ]
    }
    EstateSyncListing.createMany(listings)
  }

  static async propertyProcessingSucceeded(payload) {
    const propertyId = payload.id
    const credential = await EstateSyncService.getBreezeEstateSyncCredential()
    const listing = await EstateSyncListing.query()
      .where('estate_sync_property_id', propertyId)
      .where('status', STATUS_DRAFT)
      .first()

    if (listing) {
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
  }

  static async publicationSucceeded(payload) {
    if (payload.type === 'delete') {
      return
    }
    if (payload.type === 'set') {
      const listing = await EstateSyncListing.query()
        .where('estate_sync_listing_id', payload.listingId)
        .first()
      if (listing) {
        await listing.updateItem({ publish_url: payload.publicUrl })
        //TODO: websocket update frontend estate_id: listing.estate_id, publisher: listing.provider
        await EstateSyncService.propertyProcessingSucceeded({ id: listing.estate_sync_property_id })
      }
      return
    }
  }
}

module.exports = EstateSyncService
