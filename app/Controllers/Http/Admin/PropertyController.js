'use strict'
const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  STATUS_DELETE,
  ROLE_LANDLORD,
  LETTING_TYPE_LET,
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
  ESTATE_SYNC_LISTING_STATUS_POSTED,
  WEBSOCKET_EVENT_ESTATE_PUBLISH_APPROVED,
  ESTATE_SYNC_LISTING_STATUS_DELETED,
  WEBSOCKET_EVENT_ESTATE_UNPUBLISHED_BY_ADMIN,
  PUBLISH_STATUS_APPROVED_BY_ADMIN,
  PUBLISH_STATUS_DECLINED_BY_ADMIN,
  PUBLISH_STATUS_INIT,
  DEACTIVATE_PROPERTY,
  PUBLISH_PROPERTY,
  UNPUBLISH_PROPERTY,
  WEBSOCKET_EVENT_ESTATE_PUBLISH_DECLINE,
  WEBSOCKET_EVENT_ESTATE_PUBLISH_DECLINED,
} = require('../../../constants')
const { isArray } = require('lodash')
const { props, Promise } = require('bluebird')
const HttpException = require('../../../Exceptions/HttpException')

const Estate = use('App/Models/Estate')
const EstateSyncListing = use('App/Models/EstateSyncListing')
const File = use('App/Models/File')
const Image = use('App/Models/Image')
const MailService = use('App/Services/MailService')
const EstateSyncService = use('App/Services/EstateSyncService')
const QueueService = use('App/Services/QueueService')
const {
  exceptions: { IS_CURRENTLY_PUBLISHED_IN_MARKET_PLACE },
} = require('../../../exceptions')
const NoticeService = require('../../../Services/NoticeService')

class PropertyController {
  async getProperties({ request, response }) {
    let { activation_status, user_status, estate_status, id, page, limit } = request.all()
    page = page || 1
    limit = limit || 50
    if (!activation_status) {
      activation_status = [
        USER_ACTIVATION_STATUS_NOT_ACTIVATED,
        USER_ACTIVATION_STATUS_ACTIVATED,
        USER_ACTIVATION_STATUS_DEACTIVATED,
      ]
    }
    user_status = user_status || STATUS_ACTIVE
    estate_status = estate_status || [STATUS_EXPIRE, STATUS_ACTIVE, STATUS_DRAFT]
    let query = Estate.query()
      .select(
        'estates.id',
        'estates.address',
        'estates.status',
        'estates.six_char_code',
        'estates.publish_status',
        'estates.property_id',
        'estates.available_start_at',
        'estates.available_end_at',
        'estates.updated_at'
      )
      .select(Database.raw('_u.user'))
      .whereNot('estates.status', STATUS_DELETE)
      .whereIn('estates.status', estate_status)
      //owner
      .innerJoin(
        Database.select(
          Database.raw(`jsonb_build_object(
            'firstname', users.firstname, 'secondname', users.secondname, 'email', users.email
            ) as user`),
          Database.raw(`users.id as user_id`)
        )
          .table('users')
          .where('role', ROLE_LANDLORD)
          .whereIn('status', isArray(user_status) ? user_status : [user_status])
          .whereIn('activation_status', activation_status)
          .as('_u'),
        'estates.user_id',
        '_u.user_id'
      )
      .with('estateSyncListings')
      .withCount('visits')
      .with('final')
      .withCount('inviteBuddies')
      .withCount('knocked')
      .orderBy('estates.updated_at', 'desc')
    if (id) {
      query.where('id', id)
    }
    let estates = await query.paginate(page, limit)
    let pages = estates.pages
    estates = estates.rows.map((estate) => {
      estate = estate.toJSON()
      estate.invite_count =
        parseInt(estate['__meta__'].knocked_count) +
        parseInt(estate['__meta__'].inviteBuddies_count)
      estate.visit_count = parseInt(estate['__meta__'].visits_count)
      estate.final_match_count = parseInt(estate['__meta__'].final_count)
      return estate
    })
    return response.res({ estates, pages })
  }

  async getSingle({ request, response }) {
    const { id } = request.all()
    const estate = await Estate.query()
      .where('estates.id', id)
      .whereNot('status', STATUS_DELETE)
      .with('user', function (u) {
        u.select('id', 'company_id', 'firstname', 'secondname', 'email as landlordEmail')
        u.with('company', function (c) {
          c.select('id', 'avatar', 'name', 'visibility')
          c.with('contacts', function (ct) {
            ct.select('id', 'full_name', 'company_id')
          })
        })
      })
      .with('current_tenant', function (q) {
        q.with('user')
      })
      .with('rooms', function (q) {
        q.with('room_amenities').with('images')
      })
      .with('estateSyncListings')
      .with('files')
      .with('point')
      .first()
    if (!estate) {
      throw new HttpException('Estate Not Found!', 404)
    }
    return response.res(estate)
  }

  async publishEstate(id, publishers) {
    const estate = await EstateService.getById(id)
    if (
      [STATUS_DRAFT, STATUS_EXPIRE].includes(estate.status) &&
      estate.letting_type !== LETTING_TYPE_LET
    ) {
      // Validate is Landlord fulfilled contacts
      //Test whether estate is still published in MarketPlace
      const isCurrentlyPublishedInMarketPlace = await EstateSyncListing.query()
        .whereIn('status', [
          ESTATE_SYNC_LISTING_STATUS_PUBLISHED,
          ESTATE_SYNC_LISTING_STATUS_POSTED,
        ])
        .where('estate_id', estate.id)
        .first()
      if (isCurrentlyPublishedInMarketPlace) {
        throw new HttpException(IS_CURRENTLY_PUBLISHED_IN_MARKET_PLACE, 400, 113210)
      }

      try {
        const result = await EstateService.publishEstate({
          estate,
          publishers,
          performed_by: null,
        })
        return await EstateService.getByIdWithDetail(id)
      } catch (e) {
        if (e.name === 'ValidationException') {
          Logger.error(e)
          throw new HttpException('User not activated', 409, 113212)
        }
        throw new HttpException(e.message, e.status || 400, 113213)
      }
    } else {
      throw new HttpException('Estate status is invalid', 400, 113211)
    }
  }

  async approvePublish(id) {
    const requestPublishEstate = await EstateService.publishRequestedProperty(id)
    if (!requestPublishEstate) {
      throw new HttpException('This estate is not marked for publish', 400, 114001)
    }
    const trx = await Database.beginTransaction()
    try {
      /*
      await props({
        delMatches: Database.table('matches')
          .where({ estate_id: isRequestingPublish.estate_id })
          .delete()
          .transacting(trx),
        delLikes: Database.table('likes')
          .where({ estate_id: isRequestingPublish.estate_id })
          .delete()
          .transacting(trx),
        delDislikes: Database.table('dislikes')
          .where({ estate_id: isRequestingPublish.estate_id })
          .delete()
          .transacting(trx),
      })*/
      await Estate.query()
        .where('id', id)
        .update({ status: STATUS_ACTIVE, publish_status: PUBLISH_STATUS_APPROVED_BY_ADMIN }, trx)
      await trx.commit()
      const listings = await EstateSyncListing.query()
        .where('estate_id', id)
        .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
        .fetch()
      const data = {
        success: true,
        property_id: requestPublishEstate.property_id,
        estate_id: requestPublishEstate.estate_id,
        publish_status: PUBLISH_STATUS_APPROVED_BY_ADMIN,
        status: STATUS_ACTIVE,
        type: 'approved-publish',
        listings: listings?.rows || [],
      }
      await EstateSyncService.emitWebsocketEventToLandlord({
        event: WEBSOCKET_EVENT_ESTATE_PUBLISH_APPROVED,
        user_id: requestPublishEstate.user_id,
        data,
      })
      await MailService.estatePublishRequestApproved(requestPublishEstate)
      //await NoticeService.notifyLandlordAdminApprovesPublish(requestPublishEstate)
      QueueService.estateSyncPublishEstate({ estate_id: id })
      return true
    } catch (err) {
      console.log(err)
      await trx.rollback()
      throw new HttpException(err.messsage, 400, 114002)
    }
  }

  async declinePublish(id) {
    const requestPublishEstate = await EstateService.publishRequestedProperty(id)
    if (!requestPublishEstate) {
      throw new HttpException('This estate is not marked for publish', 400, 114002)
    }
    await Estate.query()
      .where('id', id)
      .update({ status: STATUS_DRAFT, publish_status: PUBLISH_STATUS_DECLINED_BY_ADMIN })
    await EstateSyncService.markListingsForDelete(id)
    const listings = await EstateSyncListing.query()
      .where('estate_id', id)
      .whereNot('status', ESTATE_SYNC_LISTING_STATUS_DELETED)
      .fetch()
    const data = {
      success: true,
      property_id: requestPublishEstate.property_id,
      estate_id: requestPublishEstate.estate_id,
      publish_status: PUBLISH_STATUS_DECLINED_BY_ADMIN,
      status: STATUS_DRAFT,
      type: 'declined-publish',
      listings: listings?.rows || [],
    }
    EstateSyncService.emitWebsocketEventToLandlord({
      event: WEBSOCKET_EVENT_ESTATE_PUBLISH_DECLINED,
      user_id: requestPublishEstate.user_id,
      data,
    })
    QueueService.estateSyncUnpublishEstates([id], false)
    return true
  }

  async updatePublishStatus({ request, response }) {
    const { ids, action, publishers, id } = request.all()
    if (id) {
      const estate = await EstateService.getById(id)
      if (!estate) {
        throw new HttpException('Estate not found', 400, 113214)
      }
    }
    const trx = await Database.beginTransaction()
    let ret
    switch (action) {
      case 'approve-publish':
        ret = await this.approvePublish(id)
        return response.res(ret)
      case 'decline-publish':
        ret = await this.declinePublish(id)
        return response.res(ret)
      case PUBLISH_PROPERTY:
        ret = await this.publishEstate(id, publishers)
        return response.res(ret)
      case DEACTIVATE_PROPERTY:
        await EstateService.deactivateBulkEstates(ids)
        return response.res(ids)
      case UNPUBLISH_PROPERTY:
        try {
          await EstateService.unpublishBulkEstates(ids)
          return response.res(ids.length)
        } catch (error) {
          await trx.rollback()
          throw new HttpException(error.message, 422)
        }
    }
    await trx.rollback()
    throw new HttpException('Action not allowed.')
  }

  async getAllPropertyImages({ request, response }) {
    const { id } = request.all()
    const files = await File.query().where('estate_id', id).fetch()
    const images = await Image.query()
      .select('images.*', 'rooms.name')
      .innerJoin('rooms', 'images.room_id', 'rooms.id')
      .where('rooms.estate_id', id)
      .where('rooms.status', STATUS_ACTIVE)
      .fetch()
    const docs = await Estate.query().select('energy_proof').where('id', id).first()
    return response.res({ files, images, docs })
  }
}

module.exports = PropertyController
