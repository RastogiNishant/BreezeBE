
import { EstateSync } from '@App/Classes/EstateSync'
import type { EstateSyncListing } from '@App/Classes/EstateSyncTypes'
import { EstateWithDetails } from '@App/Classes/EstateTypes'
import { ESTATE_SYNC_CREDENTIAL_TYPE, ESTATE_SYNC_LISTING_STATUS, EstateSyncCredentialType, USER_STATUS } from '@App/constants'
import { isDefined } from '@App/core/helper'
import * as EstateSyncCredential from '@App/Models/EstateSyncCredential'
import * as BluebirdPromise from 'bluebird'

const EstateService = require('./EstateService')

const EstateSyncListing = use('App/Models/EstateSyncListing')
const EstateSyncTarget = use('App/Models/EstateSyncTarget')
const UnitCategory = use('App/Models/UnitCategory')
const HttpException = use('App/Exceptions/HttpException')
const Logger = use('Logger')
const WebSocket = use('App/Classes/Websocket')

const { WEBSOCKET_EVENT_ESTATE_SYNC_POSTING, WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING, IS24_PUBLISHING_STATUS_PUBLISHED } = require("../constants")

type Credentials = {
	type: EstateSyncCredentialType
	api_key?: string
	id: number
	estate_sync_contact_id?: string
}

export const credentials = {
	async forBreeze(): Promise<Credentials | undefined> {
		const credential = await EstateSyncCredential.query()
      .whereNull('user_id')
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE.BREEZE)
      .first()
			if (isDefined(credential)) {
				return {
					type: credential.type,
					api_key: credential.api_key,
					id: credential.id,
					estate_sync_contact_id: credential.estate_sync_contact_id ?? undefined
				}
			}
	},
	async forLandlord(userId: number): Promise<Credentials | undefined> {
		// only use creds from database directly
		// const credential: Credentials = {
    //   type: ESTATE_SYNC_CREDENTIAL_TYPE.BREEZE,
    //   api_key: process.env.ESTATE_SYNC_API_KEY,
    //   id: null
    // }

    const landlordCredential = await EstateSyncCredential.query()
      .where('user_id', userId)
      .where('type', ESTATE_SYNC_CREDENTIAL_TYPE.USER)
      .first()

    if (isDefined(landlordCredential?.api_key)) {
      return {
				type: ESTATE_SYNC_CREDENTIAL_TYPE.USER,
				api_key: landlordCredential.api_key,
				id: landlordCredential.id
			}
    }
		// fallback to breeze api key when user has none
		else {
      const breezeCredential = await this.forBreeze()
      if (isDefined(breezeCredential?.api_key)) {
        return breezeCredential
      }
    }
	}
}

async function createEstateSyncClient (userId: number): Promise<{ client: EstateSync, credentials: Credentials }> {
	const credential = await credentials.forLandlord(userId)
	if (isDefined(credential?.api_key)) {
		return {
			client: new EstateSync(credential.api_key),
			credentials: credential!
		}
	}
	
	throw new HttpException("no credentials found for estate sync api")
}

export const EstateSyncServiceNew = {

	// make this private when all old estatesync service is moved over
	async createEstateSyncClient(userId: number): ReturnType<typeof createEstateSyncClient> {
		return await createEstateSyncClient(userId)
	},

	async postEstate({ estate_id: estateId }: { estate_id: number }, isBuilding = false): Promise<void> {
		if (!isDefined(estateId)) {
			return
		}

		// we have multiple targets for the listing but only need one property_id for all listings
		const estateListings = (await EstateSyncListing.query()
			.where('estate_id', estateId)
			.fetch())
			.toJSON() as EstateSyncListing[]

		// do not post again if already posted on any listing
		const isAlreadyPosted = estateListings.find(
			(estateListing) => estateListing.estate_sync_property_id !== null &&
				estateListing.status !== ESTATE_SYNC_LISTING_STATUS.DELETED
		) !== undefined

		if (isAlreadyPosted === true) {
			return
		}

		// check if there is an instance to post
		const toPost = estateListings.find(
			(estateListing) => estateListing.status === ESTATE_SYNC_LISTING_STATUS.INITIALIZED
		) !== undefined

		if (toPost === false) {
			return
		}
		
		// load estate data
		const estate = (await EstateService.getByIdWithDetail(estateId)).toJSON() as EstateWithDetails
		if (!Number(estate.usable_area)) {
			estate.usable_area = estate.area
		}

		// get estateSyncClient
		// const { createEstateSyncClient } = require('./EstateSyncServiceNew')
		const { client: estateSync, credentials } = (await createEstateSyncClient(estate.user_id)) ?? {}
		if (estateSync === undefined || !isDefined(credentials.estate_sync_contact_id)) {
			throw new HttpException('EstateSyncClient could not be initialized')
		}

		// post the estate
		const resp = await estateSync.postEstate({ estate, contactId: credentials.estate_sync_contact_id }, isBuilding)

		// process the response data from estate sync
		if (resp?.success === true) {
			// update all estates and estate_sync_property_id to posted (unless already deleted)
			await EstateSyncListing.query()
				.where('estate_id', estate.id)
				.whereNot('status', ESTATE_SYNC_LISTING_STATUS.DELETED)
				.update({
					estate_sync_property_id: resp.data?.id,
					status: ESTATE_SYNC_LISTING_STATUS.POSTED,
					posting_error: false,
					posting_error_message: null
				})
			
			// @todo keep track of working integration differently
			// post data to new relic
		} else {
			Logger.error(JSON.stringify({ post_estate_sync_error: resp }))
			// estate sync replied with error
			await EstateSyncListing.query().where('estate_id', estateId).update({
				posting_error: true,
				posting_error_message: resp?.data?.message
			})
			
			// send websocket info
			await WebSocket.publishToLandlord({
				event: WEBSOCKET_EVENT_ESTATE_SYNC_POSTING,
				user_id: estate.user_id,
				data: {
					success: false,
					type: 'error-posting',
					estate_id: estate.id,
					message: resp?.data?.message // FIXME: message here could be too technical.
				}
			})

			// emergency email
			try {
				// POSTING ERROR. Send websocket event
				await require('./MailService').sendEmailToOhneMakler(
					`Error on the Post response: ${resp?.success} ` + JSON.stringify(resp),
					'barudo@gmail.com'
				)
			}
			catch(exc) {}
		}
	},

	async propertyProcessingSucceededCallback ({ id: propertyId, processingStatus }: { id: string, processingStatus: 'successful' }) {
		let trace = '';

		try {
			if (!isDefined(propertyId) || processingStatus !== 'successful') {
				return
			}

			// get all listings
			const listings = await EstateSyncListing.query()
        .where('estate_sync_property_id', propertyId)
        .where('status', ESTATE_SYNC_LISTING_STATUS.POSTED)
        .whereNull('estate_sync_listing_id')
        .fetch()

			if (listings?.rows?.length === 0) {
				throw new HttpException(
					`[EstateSync-propertyProcessingSucceededCallback] No propertyId [${propertyId}] for any listing in the database`
				)
			}

			// fetch related user credentials
			const estate = await EstateService.getQuery({ estate_id: listings.rows[0].estate_id }).with("user").first()
			const { client: estateSyncClient, credentials } = await createEstateSyncClient(estate.user_id)

			// publish to each target
			await BluebirdPromise.map(
				listings.rows.map(
					async (listing: { provider: string, updateItem: (data: any) => Promise<void> }) => {
						// load target for publishing
						let target = await EstateSyncTarget.query()
							.where('publishing_provider', listing.provider)
							.where('estate_sync_credential_id', credentials.id)
							.where('status', USER_STATUS.ACTIVE)
							.first()

						if (!isDefined(target)) {
							// no target
							trace += `\nNo target for publish...`
							await listing.updateItem({
								status: ESTATE_SYNC_LISTING_STATUS.ERROR_FOUND,
								publishing_error: true,
								publishing_error_message: 'No valid provider found.'
							})

							throw new HttpException('[EstateSync-propertyProcessingSucceededCallback]\n' + trace)
						}

						// send a listing to estate sync
						const listingResponse = await estateSyncClient?.post('listings', {
							targetId: target.estate_sync_target_id,
							propertyId
						})

						trace += `\nPOST TO LISTING: ${target.estate_sync_target_id}, ${propertyId}`

						if (listingResponse.success) {
							trace += `\nSuccessfully posted...`
							await listing.updateItem({
								estate_sync_listing_id: listingResponse.data.id,
								user_connected: credentials.type === ESTATE_SYNC_CREDENTIAL_TYPE.USER
							})
							
							const isCategoryPublished =
								await require('./UnitCategoryService').isCategoryPublished(propertyId)
							
							if (isCategoryPublished) {
								await UnitCategory.query()
									.where('id', isCategoryPublished.id)
									.update({ is24_publish_status: IS24_PUBLISHING_STATUS_PUBLISHED })
								await require('./UnitCategoryService').setBuildingPublishingStatusPublished(
									isCategoryPublished.build_id
								)
							}
							// has listing_id but we need to wait for websocket call to make this
						} else {
							if (listingResponse?.data?.message) {
								trace += `\nError found while posting: ${listingResponse?.data?.message}`
								await listing.updateItem({
									status: ESTATE_SYNC_LISTING_STATUS.ERROR_FOUND,
									publishing_error: true,
									publishing_error_message: listingResponse.data.message,
									user_connected: credentials.type === ESTATE_SYNC_CREDENTIAL_TYPE.USER
								})
							}
							// log for later
							Logger.info('EstateSync [propertyProcessingSucceededCallback]\n' + trace)
							// send websocket info
							await WebSocket.emitWebsocketEventToLandlord({
								event: WEBSOCKET_EVENT_ESTATE_SYNC_PUBLISHING,
								user_id: estate.user_id,
								data: {
									success: false,
									type: 'error-publishing',
									estate_id: estate.id,
									provider: listing.provider,
									message: listingResponse?.data?.message
								}
							})
						}
					}
				)
			)
		}
		catch(exc) {
			Logger.error('ERROR\n' + exc)
			throw new HttpException(trace)
		}
	}
}

// @ts-ignore
EstateSyncServiceNew.EstateSyncServiceNew = EstateSyncServiceNew
// @ts-ignore
EstateSyncServiceNew.credentials = credentials
module.exports = EstateSyncServiceNew