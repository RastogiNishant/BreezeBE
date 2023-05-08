'use_strict'

const HttpException = require('../Exceptions/HttpException')
const {
  ESTATE_SYNC_CREDENTIAL_TYPE_BREEZE,
  ESTATE_SYNC_CREDENTIAL_TYPE_USER,
  WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
  WEBSOCKET_EVENT_ESTATE_SYNC_POSTING,
  ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
  ESTATE_SYNC_LISTING_STATUS_POSTED,
  ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
  ESTATE_SYNC_LISTING_STATUS_DELETED,
  ESTATE_SYNC_LISTING_STATUS_ERROR_FOUND,
  ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE,
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

  static async saveMarketPlacesInfo(
    { estate_id, estate_sync_property_id, performed_by, publishers },
    trx
  ) {
    let listingExists = []

    if (publishers?.length) {
      listingExists = (
        await EstateSyncListing.query()
          .where('estate_id', estate_id)
          .whereIn('provider', publishers)
          .fetch()
      ).toJSON()
    }
    try {
      await Promise.map(
        publishers,
        async (publisher) => {
          if (listingExists.find((list) => list.provider === publisher)) {
            await EstateSyncListing.query()
              .update({
                status: estate_sync_property_id
                  ? ESTATE_SYNC_LISTING_STATUS_POSTED
                  : ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
                performed_by,
                estate_sync_property_id,
                estate_sync_listing_id: null,
                publish_url: null,
                posting_error: false,
                publishing_error: false,
                posting_error_message: '',
                publishing_error_message: '',
                publishing_error_type: '',
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
                status: estate_sync_property_id
                  ? ESTATE_SYNC_LISTING_STATUS_POSTED
                  : ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
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
          status: ESTATE_SYNC_LISTING_STATUS_DELETED,
          estate_sync_listing_id: null,
          publish_url: null,
        })
        .transacting(trx)
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  static async isAlreadyPosted(estate_id) {
    return !!(await EstateSyncListing.query()
      .where('estate_id', estate_id)
      .whereNotNull('estate_sync_property_id')
      .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
      .first())
  }

  static async postEstate({ estate_id }) {
    try {
      if (!estate_id) {
        return
      }

      if (await this.isAlreadyPosted(estate_id)) {
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

      let data = {
        success: true,
        type: 'success-posting',
        estate_id,
      }

      if (resp?.success) {
        //make all with estate_id and estate_sync_property_id to draft
        await EstateSyncListing.query()
          .where('estate_id', estate.id)
          .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
          .update({
            estate_sync_property_id: resp.data.id,
            status: ESTATE_SYNC_LISTING_STATUS_POSTED,
          })
      } else {
        //POSTING ERROR. Send websocket event
        data = {
          ...data,
          success: false,
          type: 'error-posting',
          message: resp?.data?.message, //FIXME: message here could be too technical.
        }
        await EstateSyncListing.query().where('estate_id', estate_id).update({
          posting_error: true,
          posting_error_message: resp?.data?.message,
        })
        Logger.error(JSON.stringify({ post_estate_sync_error: resp }))
        //FIXME: replace this with logger...
        await EstateSyncService.emitWebsocketEventToLandlord({
          event: WEBSOCKET_EVENT_ESTATE_SYNC_POSTING,
          user_id: estate.user_id,
          data,
        })
      }
    } catch (e) {
      console.log('Post Estate to Estate Sync error', e.message)
    }
  }

  static async unpublishEstate(estate_id) {
    try {
      const listings = await EstateSyncListing.query()
        .where('estate_id', estate_id)
        .whereNotNull('estate_sync_listing_id')
        .where('status', ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE)
        .where('publishing_error', false) //we're going to process only those that didn't have error yet
        .fetch()

      const credential = await EstateSyncService.getBreezeEstateSyncCredential()
      const estateSync = new EstateSync(credential.api_key)

      await Promise.map(listings.rows, async (listing) => {
        await estateSync.delete(listing.estate_sync_listing_id, 'listings')
      })
    } catch (e) {
      console.log('unpublishEstate error', e.message)
    }
  }

  static async propertyProcessingSucceeded(payload) {
    try {
      const propertyId = payload.id
      const credential = await EstateSyncService.getBreezeEstateSyncCredential()
      let listings = await EstateSyncListing.query()
        .where('estate_sync_property_id', propertyId)
        .where('status', ESTATE_SYNC_LISTING_STATUS_POSTED)
        .where('posting_error', false)
        .whereNull('estate_sync_listing_id')
        .fetch()

      if (!listings?.rows?.length) {
        return
      }
      const estateSync = new EstateSync(credential.api_key)
      await Promise.map(listings.rows, async (listing) => {
        const target = await EstateSyncTarget.query()
          .where('publishing_provider', listing.provider)
          .where('estate_sync_credential_id', credential.id)
          .first()

        const resp = await estateSync.post('listings', {
          targetId: target.estate_sync_target_id,
          propertyId,
        })
        if (resp.success) {
          await listing.updateItem({ estate_sync_listing_id: resp.data.id })
          //has listing_id but we need to wait for websocket call to make this
        } else {
          //FIXME: replace this with logger...
          const MailService = use('App/Services/MailService')
          await MailService.sendEmailToOhneMakler(
            `LISTING ERR RESULT: ${JSON.stringify(resp)}`,
            'barudo@gmail.com'
          )
          //PUBLISHING_ERROR Send websocket event
          const estate = await Estate.query()
            .select('user_id')
            .where('id', listing.estate_id)
            .first()
          await EstateSyncService.emitWebsocketEventToLandlord({
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
        }
      })
    } catch (e) {
      console.log('propertyProcessingSucceeded error', e.message)
    }
  }

  static async publicationSucceeded(payload) {
    try {
      if (!payload?.listingId) {
        return
      }

      const listing = await EstateSyncListing.query()
        .where('estate_sync_listing_id', payload.listingId)
        .where('posting_error', false)
        .first()

      if (!listing) {
        return
      }

      if (payload.type === 'delete') {
        await listing.updateItem({ estate_sync_listing_id: null, publish_url: null })
        const listings = await EstateSyncListing.query()
          .whereIn('status', [ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE])
          .whereNotNull('estate_sync_listing_id')
          .fetch()
        if (!listings?.rows?.length && payload.propertyId) {
          const credential = await EstateSyncService.getBreezeEstateSyncCredential()
          const estateSync = new EstateSync(credential.api_key)
          await estateSync.delete(payload.propertyId, 'properties')
          await EstateSyncListing.query()
            .where('estate_sync_property_id', payload.propertyId)
            .update({
              status: ESTATE_SYNC_LISTING_STATUS_DELETED,
              estate_sync_property_id: null,
            })
          //add websocket call for all unpublished...
        }
      } else if (payload.type === 'set') {
        await listing.updateItem({
          publish_url: payload.publicUrl,
          status: ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
        })
        const estate = await Estate.query()
          .select('user_id')
          .select('property_id')
          .where('id', listing.estate_id)
          .first()
        let data = listing
        data.success = true
        data.type = 'success-publishing'
        data.property_id = estate.property_id
        /* websocket emit to landlord */
        await EstateSyncService.emitWebsocketEventToLandlord({
          event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
          user_id: estate.user_id,
          data,
        })
      }
    } catch (e) {
      console.log('publicationSucceeded error', e.message)
    }
  }

  static async publicationFailed(payload) {
    try {
      if (!payload?.listingId) {
        return
      }
      const listing = await EstateSyncListing.query()
        .where('estate_sync_listing_id', payload.listingId)
        .first()

      if (!listing || !listing.estate_id) {
        return
      }

      const estate = await Estate.query()
        .select('user_id')
        .select('property_id')
        .where('id', listing.estate_id)
        .first()

      if (payload.type === 'delete') {
        //mark error
        await listing.updateItem({
          estate_sync_listing_id: null,
          publish_url: null,
          publishing_error: true,
          publishing_error_message: payload.failureMessage,
          publishing_error_type: 'delete',
        })
        //continue unpublishing others
        await EstateSyncService.unpublishEstate(listing.estate_id)
      } else if (payload.type === 'set') {
        //mark error
        await listing.updateItem({
          status: ESTATE_SYNC_LISTING_STATUS_ERROR_FOUND,
          publishing_error: true,
          publishing_error_message: payload.failureMessage,
          publishing_error_type: 'set',
        })
        const credential = await EstateSyncService.getBreezeEstateSyncCredential()
        const estateSync = new EstateSync(credential.api_key)
        await estateSync.delete(payload.listingId, 'listings')
      }

      let data = listing
      data.success = false
      data.type = 'error-publishing'
      data.property_id = estate.property_id
      data.message = payload.failureMessage
      data.estate_id = listing.estate_id

      await EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
        user_id: estate.user_id,
        data,
      })
    } catch (e) {
      console.log('publicationFailed error', e.message)
    }
  }

  static async emitWebsocketEventToLandlord({ event, user_id, data }) {
    const channel = `landlord:*`
    const topicName = `landlord:${user_id}`
    const topic = Ws?.getChannel(channel)?.topic(topicName)

    if (topic) {
      topic.broadcast(event, data)
    }
  }

  /* this is called by QueueService */
  static async unpublishMultipleEstates(estate_ids) {
    try {
      const listings = await EstateSyncListing.query()
        .select('estate_id')
        .whereIn('status', [
          ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE,
          ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
        ])
        .whereIn('estate_id', estate_ids)
        .groupBy('estate_id')
        .fetch()
      await Promise.map(
        listings.rows,
        async (listing) => {
          await EstateSyncService.unpublishEstate(listing.estate_id)
        },
        { concurrency: 1 }
      )
    } catch (e) {
      Logger.use(`unpublishMultipleEstates error ${e.message}`)
    }
  }

  static async markListingsForDelete(estateId) {
    try {
      await EstateSyncListing.query()
        .where('estate_id', estateId)
        .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
        .update({ status: ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE })
    } catch (e) {
      Logger.use(`markListingsForDeletion error ${e.message}`)
    }
  }
}

module.exports = EstateSyncService
