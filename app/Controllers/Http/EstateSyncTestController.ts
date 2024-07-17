'use strict'

import { EstateWithDetails } from '@App/Classes/EstateTypes'
import { EstateSync } from '@App/Classes/EstateSync'
import {
  USER_STATUS,
  PUBLISH_STATUS,
  ESTATE_SYNC_LISTING_STATUS
} from '../../constants'

const HttpException = use('App/Exceptions/HttpException')

const EstateService = use('App/Services/EstateService')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')
const EstateSyncListing = use('App/Models/EstateSyncListing')

export const EstateSyncTestController = {
  /**
   * Testing output used in estate sync requests
   */
  async generateEstateData ({ request, response }): Promise<void> {
    const { estateId } = request.all()

    const estate: EstateWithDetails = (await EstateService.getByIdWithDetail(estateId)).toJSON()

    if (estate?.status !== USER_STATUS.ACTIVE || estate?.publish_status !== PUBLISH_STATUS.APPROVED_BY_ADMIN) {
      throw new HttpException('Estate not found or not published.', 404)
    }

    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
    const resp = estateSync.generateEstateData({
      estate,
      contactId: 'just a placeholder for testing'
    })

    response.res(resp)
  },

  /**
   * Testing data update
   */
  async updateProperty ({ request, response }): Promise<void> {
    const { estateId } = request.all()

    const estate: EstateWithDetails = (await EstateService.getByIdWithDetail(estateId)).toJSON()
    const propertyListing = await EstateSyncListing.query()
      .where('estate_id', estateId)
      .first()

    try {
      const credentials = await EstateSyncCredential.query().where('type', 'breeze').first()
      const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
      const resp = await estateSync.updateEstate({
        estate,
        contactId: credentials.estate_sync_contact_id,
        propertyId: propertyListing.estate_sync_property_id
      })

      response.res(resp)
    } catch (exc) {
      console.log(exc)
      response.res(exc)
    }
  },

  /**
   * Testing the creation of estate sync listing
   */
  async publishProperty ({ request, response }): Promise<void> {
    const { estateId } = request.all()

    const propertyListing = await EstateSyncListing.query()
      .whereIn('status', [
        ESTATE_SYNC_LISTING_STATUS.POSTED
      ])
      .where('estate_id', estateId)
      .first()

    try {
      const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)

      const resp = await estateSync.publishEstate({ targetId: '8c4xE7RfZMzxcUwsNHXT', propertyId: propertyListing.estate_sync_property_id })
      response.res(resp)
    } catch (exc) {
      console.log(exc)
      response.res(exc)
    }
  },

  /**
   * Testing deletion of listing
   */
  async removeProperty ({ request, response }): Promise<void> {
    let { estateId, propertyId } = request.all()

    if (propertyId === undefined) {
      const propertyListing = await EstateSyncListing.query()
        .whereIn('status', [
          ESTATE_SYNC_LISTING_STATUS.POSTED
        ])
        .where('estate_id', estateId)
        .first()

      propertyId = propertyListing.estate_sync_property_id
    }

    // get all listings
    if (propertyId !== undefined) {
      const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
      const listings = await estateSync.get('listings')
      let listingArr = listings.success ? listings.data : []

      // filter for current property
      listingArr = listingArr.filter(
        (listing: any) => listing.propertyId === propertyId
      )

      try {
        // remove all listings before property
        for (let i = 0; i < listingArr.length; ++i) {
          await estateSync.delete(listingArr[i].id, 'listings')
        }

        const result = await estateSync.delete(propertyId, 'properties')
        response.res(result)
      } catch (exc) {
        response.res(exc)
      }
    }
  }
}
