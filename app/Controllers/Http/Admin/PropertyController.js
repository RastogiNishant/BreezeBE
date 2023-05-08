'use strict'
const Database = use('Database')
const EstateService = use('App/Services/EstateService')
const {
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  STATUS_DELETE,
  ROLE_LANDLORD,
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
} = require('../../../constants')
const { isArray } = require('lodash')
const Promise = require('bluebird')
const HttpException = require('../../../Exceptions/HttpException')

const Estate = use('App/Models/Estate')
const File = use('App/Models/File')
const Image = use('App/Models/Image')
const {
  exceptions: { IS_CURRENTLY_PUBLISHED_IN_MARKET_PLACE },
} = require('../../../exceptions')

class PropertyController {
  async getProperties({ request, response }) {
    let { activation_status, user_status, estate_status } = request.all()
    if (!activation_status) {
      activation_status = [
        USER_ACTIVATION_STATUS_NOT_ACTIVATED,
        USER_ACTIVATION_STATUS_ACTIVATED,
        USER_ACTIVATION_STATUS_DEACTIVATED,
      ]
    }
    user_status = user_status || STATUS_ACTIVE
    estate_status = estate_status || [STATUS_EXPIRE, STATUS_ACTIVE]
    let estates = await Estate.query()
      .select('estates.id', 'estates.address', 'estates.status', 'estates.six_char_code')
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
      .withCount('visits')
      .with('final')
      .withCount('inviteBuddies')
      .withCount('knocked')
      .orderBy('estates.updated_at', 'desc')
      .fetch()
    estates = estates.toJSON().map((estate) => {
      estate.invite_count =
        parseInt(estate['__meta__'].knocked_count) +
        parseInt(estate['__meta__'].inviteBuddies_count)
      estate.visit_count = parseInt(estate['__meta__'].visits_count)
      estate.final_match_count = parseInt(estate['__meta__'].final_count)
      return estate
    })
    return response.res(estates)
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
      .with('files')
      .with('point')
      .first()
    if (!estate) {
      throw new HttpException('Estate Not Found!', 404)
    }
    return response.res(estate)
  }

  async updatePublishStatus({ request, response }) {
    const { ids, action, id } = request.all()
    const trx = await Database.beginTransaction()
    let affectedRows
    switch (action) {
      case 'publish-marketplace':
        break
      case 'publish':
        try {
          await Promise.map(ids, async (id) => {
            const estate = await Estate.findOrFail(id)
            if (
              !estate.available_start_at ||
              (!estate.is_duration_later && !estate.available_end_at) ||
              (estate.is_duration_later && !estate.min_invite_count)
            ) {
              throw new HttpException('Estates is not completely filled', 400)
            }
            if (
              [STATUS_DRAFT, STATUS_EXPIRE].includes(estate.status) &&
              estate.letting_type !== LETTING_TYPE_LET
            ) {
              // Validate is Landlord fulfilled contacts

              //Test whether estate is still published in MarketPlace
              const isCurrentlyPublishedInMarketPlace = await EstateSyncListing.query()
                .whereIn('status', [STATUS_ACTIVE, STATUS_DRAFT])
                .where('estate_id', estate.id)
                .first()
              if (isCurrentlyPublishedInMarketPlace) {
                throw new HttpException(IS_CURRENTLY_PUBLISHED_IN_MARKET_PLACE, 400, 113210)
              }

              try {
                await EstateService.publishEstate({
                  estate,
                  publishers,
                  performed_by: auth.user.id,
                })
              } catch (e) {
                if (e.name === 'ValidationException') {
                  Logger.error(e)
                  throw new HttpException('User not activated', 409)
                }
                throw new HttpException(e.message, e.status || 400)
              }
            } else {
              throw new HttpException('Invalid estate type', 400)
            }
          })

          await trx.commit()
          return response.res(affectedRows)
        } catch (error) {
          await trx.rollback()
          throw new HttpException(error.message, 422)
        }
      case 'unpublish':
        try {
          await Promise.map(ids, async (id) => {
            await EstateService.handleOfflineEstate({ estate_id: id }, trx)
          })
          affectedRows = await Estate.query()
            .whereIn('id', ids)
            .update({ status: STATUS_DRAFT }, trx)
          await trx.commit()
          return response.res(affectedRows)
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
