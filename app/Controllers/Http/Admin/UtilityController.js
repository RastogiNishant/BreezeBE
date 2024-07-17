const HttpException = use('App/Exceptions/HttpException')

const fs = use('fs/promises')
const xml2js = use('xml2js')
const { get } = use('lodash')
const map = {
  'objekt[0].interessent[0].anrede[0]': 'salutation',
  'objekt[0].interessent[0].vorname[0]': 'firstName',
  'objekt[0].interessent[0].nachname[0]': 'lastName',
  'objekt[0].interessent[0].strasse[0]': 'street',
  'objekt[0].interessent[0].plz[0]': 'postalCode',
  'objekt[0].interessent[0].ort[0]': 'city',
  'objekt[0].interessent[0].email[0]': 'email',
  'objekt[0].interessent[0].tel[0]': 'phone',
  'objekt[0].interessent[0].anfrage[0]': 'message'
}
const Database = use('Database')
const EstateSyncContactRequest = use('App/Models/EstateSyncContactRequest')
const MarketPlaceService = use('App/Services/MarketPlaceService')
const EstateService = use('App/Services/EstateService')
const EstateSyncListing = use('App/Models/EstateSyncListing')
const EstateSyncCredential = use('App/Models/EstateSyncCredential')
const Promise = use('bluebird')
const {
  ESTATE_SYNC_LISTING_STATUS_POSTED,
  ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
  ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
  ESTATE_SYNC_LISTING_STATUS_DELETED,
  STATUS_ACTIVE,
  PUBLISH_STATUS_APPROVED_BY_ADMIN
} = use('App/constants')
const Estate = use('App/Models/Estate')
const {EstateSync} = use('App/Classes/EstateSync')

class UtilityController {
  async uploadContactRequest({ request, response }) {
    const uploadedFilePathName = request.file('file')
    const { publisher } = request.all()
    const contactRequestXml = await fs.readFile(uploadedFilePathName.tmpPath, {
      encoding: 'utf8'
    })
    const xmlParser = xml2js.Parser()
    xmlParser.parseString(contactRequestXml, async function (err, json) {
      if (err) {
        throw new HttpException(`Error parsing xml: ${err.message}`)
      }
      const objId = json.openimmo_feedback.objekt[0].oobj_id[0]
      const matches = objId.match(/^production-([0-9]+)$/)
      if (!matches) {
        throw new HttpException(`No matches...`)
      }
      const estateId = matches[1]
      const result = {}
      for (const key in map) {
        if (get(json.openimmo_feedback, key)) {
          result[map[key]] = get(json.openimmo_feedback, key)
        }
      }
      const address = { city: result.city, street: result.street, postalCode: result.postalCode }
      const contact = {
        estate_id: estateId,
        email: result.email,
        message: result.message,
        contact_info: {
          firstName: result.firstName,
          lastName: result.lastName,
          address,
          phone: result.phone,
          salutation: result.salutation,
          email: result.email
        },
        publisher
      }

      if (!(await EstateService.isPublished(contact.estate_id))) {
        throw new HttpException('Estate is NOT anymore published.')
      }
      const contactRequest = await EstateSyncContactRequest.query()
        .where({
          email: contact.email,
          estate_id: contact.estate_id
        })
        .first()

      if (contactRequest) {
        throw new HttpException('This contact request was already recorded.')
      }
      const trx = await Database.beginTransaction()
      try {
        const { link, newContactRequest, estate, landlord_name, lang } =
          await MarketPlaceService.handlePendingKnock(contact, trx)
        await trx.commit()
        await require('../../../Services/QueueService').sendKnockRequestEmail(
          {
            link,
            contact: newContactRequest,
            estate,
            landlord_name,
            lang
          },
          30000
        )
        await MarketPlaceService.sendContactRequestWebsocket(newContactRequest)
        return response.res(newContactRequest)
      } catch (err) {
        throw new HttpException(err.message)
      }
    })
  }

  async postEstateSyncProperty({ request, response }) {
    const { estateId, publishers } = request.all()
    const estateIsPublished = await Estate.query()
      .where('id', estateId)
      .where('status', STATUS_ACTIVE)
      .where('publish_status', PUBLISH_STATUS_APPROVED_BY_ADMIN)
      .first()
    if (!estateIsPublished) {
      throw new HttpException('Estate not found or not published.', 404)
    }
    // validate that estate is currently not published to the publisher
    const estateIsPublishedToTarget = await EstateSyncListing.query()
      .where('estate_id', estateId)
      .whereIn('provider', publishers)
      .where('status', ESTATE_SYNC_LISTING_STATUS_PUBLISHED)
      .first()
    let estate = await EstateService.getByIdWithDetail(estateId)
    if (estateIsPublishedToTarget) {
      throw new HttpException('Estate is already published to the marketplace.', 404)
    }
    const listingExists = (
      await EstateSyncListing.query()
        .where('estate_id', estateId)
        .whereIn('provider', publishers)
        .fetch()
    ).toJSON()
    try {
      await Promise.map(
        publishers,
        async (publisher) => {
          if (listingExists.find((list) => list.provider === publisher)) {
            await EstateSyncListing.query()
              .update({
                status: ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
                estate_sync_listing_id: null,
                publish_url: null,
                posting_error: false,
                publishing_error: false,
                posting_error_message: '',
                publishing_error_message: '',
                publishing_error_type: '',
                building_id: estate.build_id,
                unit_category_id: estate.unit_category_id
              })
              .where('provider', publisher)
              .where('estate_id', estateId)
          } else {
            await EstateSyncListing.createItem({
              provider: publisher,
              estate_id: estateId,
              performed_by: estate.user_id,
              status: ESTATE_SYNC_LISTING_STATUS_INITIALIZED,
              estate_sync_property_id: null,
              building_id: estate.build_id,
              unit_category_id: estate.unit_category_id
            })
          }
        },
        { concurrency: 1 }
      )
      // soft delete all existing publishers but not anymore published
      await EstateSyncListing.query()
        .whereNotIn('provider', publishers)
        .where('estate_id', estateId)
        .update({
          estate_sync_property_id: null,
          status: ESTATE_SYNC_LISTING_STATUS_DELETED,
          estate_sync_listing_id: null,
          publish_url: null
        })

      estate = estate.toJSON()
      const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)
      if (!Number(estate.usable_area)) {
        estate.usable_area = estate.area
      }
      const resp = await estateSync.postEstate({
        estate
      })
      let data = {
        success: true,
        type: 'success-posting',
        estate_id: estateId
      }
      if (resp?.success) {
        // make all with estate_id and estate_sync_property_id to draft
        await EstateSyncListing.query()
          .where('estate_id', estate.id)
          .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
          .update({
            estate_sync_property_id: resp.data.id,
            status: ESTATE_SYNC_LISTING_STATUS_POSTED
          })
      } else {
        data = {
          ...data,
          success: false,
          type: 'error-posting',
          message: resp?.data?.message // FIXME: message here could be too technical.
        }
        await EstateSyncListing.query().where('estate_id', estateId).update({
          posting_error: true,
          posting_error_message: resp?.data?.message
        })
      }
      response.res(data)
    } catch (e) {
      throw new HttpException(e.message, e.status || 500)
    }
  }

  async updateEstateSyncProperty({ request, response }) {
    const { estateId, title, description } = request.all()
    // check if this estate is currently published to estateSync
    const listing = await EstateSyncListing.query()
      .where('estate_id', estateId)
      .whereIn('status', [ESTATE_SYNC_LISTING_STATUS_POSTED, ESTATE_SYNC_LISTING_STATUS_PUBLISHED])
      .first()
    if (!listing) {
      throw new HttpException('This property is NOT posted to EstateSync')
    }
    const credentials = await EstateSyncCredential.query().where('type', 'breeze').first()
    const {EstateSync} = use('App/Classes/EstateSync')
    const estateSync = new EstateSync(process.env.ESTATE_SYNC_API_KEY)

    let estate = await EstateService.getByIdWithDetail(estateId)
    estate = estate.toJSON()
    const ret = await estateSync.updateEstate({
      estate,
      titleOverride: title ?? estate.title,
      descriptionOverride: description ?? estate.description,
      contactId: credentials.estate_sync_contact_id,
      propertyId: listing.estate_sync_property_id
    })
    if (ret.success) {
      return response.res({ data: ret.data })
    }
    return response.res({ success: false, data: ret?.data || null })
  }
}

module.exports = UtilityController
