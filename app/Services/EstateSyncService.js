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
  WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING_ERROR,
  STATUS_ACTIVE,
  ESTATE_SYNC_PUBLISH_PROVIDER_IS24,
  ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT,
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
    let credential = await EstateSyncCredential.query()
      .where('user_id', user_id)
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE_USER)
      .first()
    if (credential) {
      credential['api_key'] = credential['api_key'] || process.env.ESTATE_SYNC_API_KEY
    } else {
      credential = EstateSyncService.getBreezeEstateSyncCredential()
    }
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
      throw new HttpException(e.message, e.status || 500)
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

      const toPost = await EstateSyncListing.query()
        .where('estate_id', estate_id)
        .where('status', ESTATE_SYNC_LISTING_STATUS_INITIALIZED)
        .first()

      if (!toPost) {
        return
      }

      let estate = await EstateService.getByIdWithDetail(estate_id)
      estate = estate.toJSON()
      let credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
      const estateSync = new EstateSync(credential.api_key)
      if (!Number(estate.usable_area)) {
        estate.usable_area = estate.area
      }
      const resp = await estateSync.postEstate({
        estate,
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

      let estate = await EstateService.getByIdWithDetail(estate_id)
      estate = estate.toJSON()
      const credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
      const estateSync = new EstateSync(credential.api_key)
      if (listings.rows.length) {
        await Promise.map(listings.rows, async (listing) => {
          await estateSync.delete(listing.estate_sync_listing_id, 'listings')
        })
      } else {
        //fix bug where property is initialized but not published
        const notPublishedListing = await EstateSyncListing.query()
          .where('estate_id', estate_id)
          .where('status', ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE)
          .first()
        if (notPublishedListing) {
          const ret = await estateSync.delete(
            notPublishedListing.estate_sync_property_id,
            'properties'
          )
          await EstateSyncListing.query().where('estate_id', estate_id).update({
            estate_sync_property_id: null,
            status: ESTATE_SYNC_LISTING_STATUS_DELETED,
            estate_sync_listing_id: null,
            publish_url: null,
          })
        }
      }
    } catch (e) {
      console.log('unpublishEstate error', e.message)
    }
  }

  static async propertyProcessingSucceeded(payload) {
    try {
      const propertyId = payload.id
      let listings = await EstateSyncListing.query()
        .where('estate_sync_property_id', propertyId)
        .where('status', ESTATE_SYNC_LISTING_STATUS_POSTED)
        .where('posting_error', false)
        .whereNull('estate_sync_listing_id')
        .fetch()

      if (!listings?.rows?.length) {
        return
      }
      let estate = await EstateService.getByIdWithDetail(listings.rows[0].estate_id)
      estate = estate.toJSON()
      const credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
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
        await listing.updateItem({
          estate_sync_listing_id: null,
          publish_url: null,
        })
        const estate = await Estate.query()
          .select('user_id')
          .select('property_id')
          .where('id', listing.estate_id)
          .first()
        if (listing.status === ESTATE_SYNC_LISTING_STATUS_ERROR_FOUND) {
          //this is a webhook call reporting of delete on a publishing declined
          //we don't have to do removing of publishes that are SCHEDULED_FOR_DELETE
          let data = listing
          data.success = false
          data.type = 'error-publishing'
          data.property_id = estate.property_id
          await EstateSyncService.emitWebsocketEventToLandlord({
            event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING_ERROR,
            user_id: estate.user_id,
            data,
          })
          return
        }

        const listings = await EstateSyncListing.query()
          .whereIn('status', [ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE])
          .where('estate_id', listing.estate_id)
          .whereNotNull('estate_sync_listing_id')
          .fetch()

        if (!listings?.rows?.length && payload.propertyId) {
          //all the scheduled for delete are exhausted. So we now remove the posted property
          const credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
          const estateSync = new EstateSync(credential.api_key)
          await estateSync.delete(payload.propertyId, 'properties')
          //removed setting estate_sync_property_id so we can still get contact_requests
          await EstateSyncListing.query()
            .where('estate_sync_property_id', payload.propertyId)
            .update({
              status: ESTATE_SYNC_LISTING_STATUS_DELETED,
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
        //we need to remove the record from estate sync but mark it as
        //ESTATE_SYNC_LISTING_STATUS_ERROR_FOUND on ours
        const credential = await EstateSyncService.getLandlordEstateSyncCredential(estate.user_id)
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
  static async unpublishMultipleEstates(estate_ids, markListingsForDelete) {
    try {
      if (markListingsForDelete) {
        await EstateSyncService.markListingsForDelete(estate_ids)
      }
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
        .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
        .whereIn('estate_id', Array.isArray(estateId) ? estateId : [estateId])
        .update({ status: ESTATE_SYNC_LISTING_STATUS_SCHEDULED_FOR_DELETE })
    } catch (e) {
      Logger.use(`markListingsForDeletion error ${e.message}`)
    }
  }

  /* Landlord specific methods */
  static async createApiKey(userId, apiKey) {
    const trx = await Database.beginTransaction()
    try {
      const credential = await EstateSyncCredential.createItem({
        user_id: userId,
        type: 'user',
        api_key: apiKey,
      })
      await trx.commit()
      return credential
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      throw new HttpException(`Error found while adding api key. We can add only one api key.`, 400)
    }
  }

  static async updateApiKey(userId, apiKey) {
    const trx = await Database.beginTransaction()
    try {
      const credential = await EstateSyncCredential.query().where('user_id', userId).first()
      if (!credential) {
        throw new HttpException(`Credential has not been created yet.`)
      }
      await credential.updateItem({
        user_id: userId,
        type: 'user',
        api_key: apiKey,
      })
      await trx.commit()
      return credential
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      throw new HttpException(`Error found while adding api key. We can add only one api key.`, 400)
    }
  }

  static async deleteApiKey(userId) {
    const trx = await Database.beginTransaction()
    try {
      const credential = await EstateSyncCredential.query().where('user_id', userId).first()
      if (!credential) {
        throw new HttpException(`Credential has not been created yet.`)
      }
      await credential.updateItem({
        api_key: null,
      })
      await trx.commit()
      return credential
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      throw new HttpException(`Error found while deleting api key.`, 400)
    }
  }

  static async getTargets(userId) {
    try {
      const targets = await EstateSyncCredential.query()
        .rightJoin('estate_sync_targets', function () {
          this.on('estate_sync_targets.estate_sync_credential_id', 'estate_sync_credentials.id').on(
            'estate_sync_targets.status',
            STATUS_ACTIVE
          )
        })
        .where('estate_sync_credentials.user_id', userId)
        .fetch()
      return targets.toJSON()
    } catch (e) {}
  }

  static async createTarget(publisher, userId, credentials = {}) {
    const trx = await Database.beginTransaction()

    try {
      const credentialInitiated = await EstateSyncCredential.query()
        .where('user_id', userId)
        .first()
      let credential
      if (credentialInitiated) {
        credential = credentialInitiated
      } else {
        const credentialCreated = await EstateSyncCredential.createItem(
          {
            user_id: userId,
            type: 'user',
          },
          trx
        )
        credential = credentialCreated
      }
      //if landlord has estate_sync api_key we're going to use it. Else we use ours
      const estateSync = new EstateSync(credential.api_key || process.env.ESTATE_SYNC_API_KEY)
      let data
      if (publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IS24) {
        data = {
          type: 'immobilienscout-24',
          redirectUrl: 'https://api-dev.breeze4me.de/api/v1/estate-sync-is24',
          autoCollectRequests: true,
        }
      } else {
        data = { type: publisher, credentials }
        if (publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT) {
          data.autoCollectRequests = true
        }
      }
      const result = await estateSync.post('targets', data)
      if (result.success) {
        const existingTarget = await EstateSyncTarget.query()
          .where('publishing_provider', publisher)
          .where('estate_sync_credential_id', credential.id)
          .first()
        if (existingTarget) {
          await existingTarget.updateItemWithTrx(
            {
              estate_sync_target_id: result.data.id,
              status: STATUS_ACTIVE,
            },
            trx
          )
        } else {
          const queryResult = await EstateSyncTarget.createItem(
            {
              estate_sync_credential_id: credential.id,
              publishing_provider: publisher,
              estate_sync_target_id: result.data.id,
            },
            trx
          )
        }
        await trx.commit()
        return result
      } else {
        throw new Error(result?.data?.message || 'Unknown error found.')
      }
    } catch (err) {
      await trx.rollback()
      if (err.message) {
        throw new HttpException(err.message)
      } else {
        throw new HttpException('Error found while adding Target')
      }
    }
  }

  static async removePublisher(userId, publisher) {
    const trx = await Database.beginTransaction()
    try {
      const targetFound = await EstateSyncCredential.query()
        .leftJoin('estate_sync_targets', function () {
          this.on('estate_sync_targets.estate_sync_credential_id', 'estate_sync_credentials.id').on(
            'estate_sync_targets.status',
            STATUS_ACTIVE
          )
        })
        .where('estate_sync_credentials.user_id', userId)
        .where('estate_sync_targets.publishing_provider', publisher)
        .first()
      if (!targetFound) {
        throw new HttpException('Target to remove not found.')
      }
      const estateSync = new EstateSync(targetFound.api_key || process.env.ESTATE_SYNC_API_KEY)
      const result = await estateSync.delete(targetFound.estate_sync_target_id, 'targets')
      if (result && result?.success) {
        await EstateSyncTarget.query()
          .where('estate_sync_credential_id', targetFound.estate_sync_credential_id)
          .where('publishing_provider', publisher)
          .update({ status: STATUS_DELETE }, trx)
      } else {
        throw new HttpException('Error found while removing target.')
      }
      await trx.commit()
      return true
    } catch (err) {
      await trx.rollback()
      if (err.message) {
        throw new HttpException(err.message)
      } else {
        throw new HttpException('Error found while removing target.')
      }
    }
  }

  static async getPublisherFromTargetId(targetId) {
    const target = await EstateSyncTarget.query().where('estate_sync_target_id', targetId).first()
    return target?.publishing_provider || null
  }
}

module.exports = EstateSyncService
