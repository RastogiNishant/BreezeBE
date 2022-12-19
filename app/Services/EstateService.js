'use strict'
const moment = require('moment')
const { isEmpty, filter, omit, flatten, groupBy, countBy, maxBy, orderBy } = require('lodash')
const { props, Promise } = require('bluebird')
const Database = use('Database')
const Drive = use('Drive')
const Event = use('Event')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const TenantService = use('App/Services/TenantService')
const CompanyService = use('App/Services/CompanyService')
const NoticeService = use('App/Services/NoticeService')
const RoomService = use('App/Services/RoomService')
const QueueService = use('App/Services/QueueService')

const User = use('App/Models/User')
const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const Visit = use('App/Models/Visit')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const File = use('App/Models/File')
const FileBucket = use('App/Classes/File')
const Import = use('App/Models/Import')
const AppException = use('App/Exceptions/AppException')
const Amenity = use('App/Models/Amenity')
const TaskFilters = require('../Classes/TaskFilters')
const OpenImmoReader = use('App/Classes/OpenImmoReader')
const {
  STATUS_DRAFT,
  STATUS_DELETE,
  STATUS_ACTIVE,
  MATCH_STATUS_NEW,
  STATUS_EXPIRE,
  DATE_FORMAT,
  LOG_TYPE_PUBLISHED_PROPERTY,
  LETTING_TYPE_LET,
  LETTING_TYPE_VOID,
  MATCH_STATUS_FINISH,
  TASK_STATUS_DRAFT,
  TASK_STATUS_DELETE,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_TOP,
  TRANSPORT_TYPE_WALK,
  SHOW_ACTIVE_TASKS_COUNT,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  LETTING_TYPE_NA,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_NEW,
  URGENCY_SUPER,
  TENANT_INVITATION_EXPIRATION_DATE,
  ROLE_LANDLORD,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_UNRESOLVED,
  IMPORT_TYPE_OPENIMMO,
  IMPORT_ENTITY_ESTATES,
} = require('../constants')

const {
  exceptions: { NO_ESTATE_EXIST },
} = require('../../app/excepions')

const { logEvent } = require('./TrackingService')
const HttpException = use('App/Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
const ChatService = require('./ChatService')
const MAX_DIST = 10000

/**
 *
 */
class EstateService {
  /**
   *
   */
  static getQuery(condition = {}) {
    if (isEmpty(condition)) {
      return Estate.query()
    }

    return Estate.query().where(condition)
  }

  /**
   *
   */
  static getActiveEstateQuery() {
    return Estate.query().whereNot('status', STATUS_DELETE)
  }

  static async getById(id) {
    return await this.getActiveEstateQuery().where({ id }).first()
  }

  static async getEstateWithDetails(id, user_id) {
    const estateQuery = Estate.query()
      .select(Database.raw('estates.*'))
      .select(Database.raw(`coalesce(_c.landlord_type, 'private') as landlord_type`))
      .leftJoin(
        Database.raw(`
          (select 
            users.id as user_id,
            companies.type as landlord_type
          from users
          left join companies
          on companies.id=users.company_id
          ) as _c`),
        function () {
          this.on('estates.user_id', '_c.user_id').on('estates.id', id)
        }
      )
      .where('estates.id', id)
      .whereNot('status', STATUS_DELETE)
      .with('point')
      .with('files')
      .with('current_tenant', function (q) {
        q.with('user')
      })
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE)
          .with('images')
          .orderBy('order', 'asc')
          .orderBy('favorite', 'desc')
          .orderBy('id', 'asc')
          .with('room_amenities', function (q) {
            q.select(
              Database.raw(
                `amenities.*,
              case
                when
                  amenities.type='amenity'
                then
                  "options"."title"
                else
                  "amenities"."amenity"
              end as amenity`
              )
            )
              .from('amenities')
              .leftJoin('options', 'options.id', 'amenities.option_id')
              .where('amenities.location', 'room')
              .whereNot('amenities.status', STATUS_DELETE)
              .orderBy('amenities.sequence_order', 'desc')
          })
      })

    if (user_id) {
      estateQuery.where('estates.user_id', user_id)
    }
    return estateQuery.first()
  }

  static async assignEstateAmenities(estate) {
    let amenities = await Amenity.query()
      .select(
        Database.raw(
          `amenities.location, json_agg(amenities.* order by sequence_order desc) as amenities`
        )
      )
      .from(
        Database.raw(`(
          select amenities.*,
            case
              when
                "amenities".type='amenity'
              then
                "options"."title"
              else
                "amenities"."amenity"
                  end as amenity
          from amenities
          left join options
          on options.id=amenities.option_id
          where
            amenities.status = '${STATUS_ACTIVE}'
          and
            amenities.location not in('room')
          and
            amenities.estate_id in ('${estate?.id}')
        ) as amenities`)
      )
      .where('status', STATUS_ACTIVE)
      .whereIn('estate_id', [estate?.id])
      .groupBy('location')
      .fetch()
    estate.amenities = amenities
    return estate
  }

  /**
   *
   */
  static async getActiveById(id, conditions = {}) {
    const query = Estate.query().where({ id }).whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
    if (!isEmpty(conditions)) {
      query.where(conditions)
    }

    return await query.first()
  }

  static async getEstateWithTenant(id, user_id) {
    const query = Estate.query()
      .select('estates.*', '_u.avatar')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id')
        this.on('_m.status', MATCH_STATUS_FINISH)
      })
      .innerJoin({ _u: 'users' }, '_m.user_id', '_u.id')
      .where('estates.id', id)
      .whereNotIn('estates.status', [STATUS_DELETE])

    query.where('estates.user_id', user_id)

    return await query.firstOrFail()
  }

  static async saveEnergyProof(request) {
    const imageMimes = [
      FileBucket.IMAGE_JPG,
      FileBucket.IMAGE_JPEG,
      FileBucket.IMAGE_PNG,
      FileBucket.IMAGE_PDF,
    ]
    const files = await FileBucket.saveRequestFiles(request, [
      { field: 'energy_proof', mime: imageMimes, isPublic: true },
    ])

    return files
  }
  /**
   *
   */
  static async createEstate({ request, data, userId }, fromImport = false, trx = null) {
    data = request ? request.all() : data

    const propertyId = data.property_id
      ? data.property_id
      : Math.random().toString(36).substr(2, 8).toUpperCase()

    if (!userId) {
      throw new HttpException('No user Id passed')
    }

    let createData = {
      ...omit(data, ['rooms']),
      user_id: userId,
      property_id: propertyId,
      status: STATUS_DRAFT,
    }

    if (request) {
      const files = await this.saveEnergyProof(request)

      if (files && files.energy_proof) {
        createData = {
          ...createData,
          energy_proof: files.energy_proof,
          energy_proof_original_file: files.original_energy_proof,
        }
      }
    }

    if (!fromImport) {
      createData.letting_type = LETTING_TYPE_VOID
      createData.letting_status = null
    }

    const estate = await Estate.createItem(
      {
        ...createData,
      },
      trx
    )

    const estateHash = await Estate.query().select('hash').where('id', estate.id).firstOrFail()

    // Run processing estate geo nearest
    QueueService.getEstateCoords(estate.id)

    const estateData = await estate.toJSON({ isOwner: true })
    return {
      hash: estateHash.hash,
      ...estateData,
    }
  }

  static async updateEstate(request) {
    const { ...data } = request.all()

    let updateData = {
      ...omit(data, ['delete_energy_proof', 'rooms', 'letting_type']),
      status: STATUS_DRAFT,
    }

    let energy_proof = null
    const estate = await this.getById(data.id)
    if (data.delete_energy_proof) {
      energy_proof = estate?.energy_proof

      updateData = {
        ...updateData,
        energy_proof: null,
        energy_proof_original_file: null,
      }
    } else {
      const files = await this.saveEnergyProof(request)
      if (files && files.energy_proof) {
        updateData = {
          ...updateData,
          energy_proof: files.energy_proof,
          energy_proof_original_file: files.original_energy_proof,
        }
      }
    }

    await estate.updateItem(updateData)

    if (data.delete_energy_proof && energy_proof) {
      FileBucket.remove(energy_proof)
    }
    // Run processing estate geo nearest
    QueueService.getEstateCoords(estate.id)
    return estate
  }

  /**
   *
   */
  static getEstates(params = {}) {
    let query = Estate.query()
      .withCount('visits')
      .withCount('knocked')
      .withCount('decided')
      .withCount('invite')
      .withCount('final')
      .withCount('inviteBuddies')
      .with('current_tenant', function (q) {
        q.with('user')
      })
      .with('rooms', function (q) {
        q.with('room_amenities').with('images')
      })
      .with('files')
    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    return query.orderBy('estates.id', 'desc')
  }

  /**
   *
   */
  static getUpcomingShows(ids, query = '') {
    return this.getEstates()
      .innerJoin({ _t: 'time_slots' }, '_t.estate_id', 'estates.id')
      .whereIn('user_id', ids)
      .whereNotIn('status', [STATUS_DELETE, STATUS_DRAFT])
      .whereNot('area', 0)
      .where(function () {
        if (query !== '') this.where('address', 'ILIKE', `%${query}%`)
      })
      .where('_t.start_at', '>', Database.fn.now())
      .with('slots')
      .orderBy('start_at', 'asc')
  }

  /**
   *
   */
  static async removeEstate(id, user_id) {
    // TODO: remove indexes
    await Estate.findByOrFail({ id, user_id })
    const trx = await Database.beginTransaction()
    try {
      const estate = await Estate.query()
        .where('id', id)
        .update({ status: STATUS_DELETE })
        .transacting(trx)

      const taskService = require('./TaskService')
      await taskService.deleteByEstateById(id, trx)

      await trx.commit()
      return estate
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async completeRemoveEstate(id) {
    await EstateCurrentTenant.query().where('estate_id', id).delete()
    return await Estate.query().where('id', id).delete()
  }

  /**
   *
   */
  static async getSqrRange({ year, sqr, quality }) {
    return Database.from('sqr_rates')
      .whereRaw(`COALESCE(min_year, 0) <= ?`, [year])
      .whereRaw(`COALESCE(max_year, 2050) >= ?`, [year])
      .whereRaw(`COALESCE(min_sqr, 0) <= ?`, [sqr])
      .whereRaw(`COALESCE(max_sqr, 100000) >= ?`, [sqr])
      .where('quality', quality)
  }

  /**
   *
   */
  static async addFile({ url, disk, estate, type }) {
    return File.createItem({ url, disk, estate_id: estate.id, type })
  }

  /**
   *
   */
  static async removeFile(file) {
    try {
      await Drive.disk(file.disk).delete(file.url)
    } catch (e) {
      Logger.error(e.message)
    }

    await File.query().delete().where('id', file.id)
  }

  static async updateCover({ room, removeImage, addImage }, trx = null) {
    try {
      const estate = await this.getById(room.estate_id)
      if (!estate) {
        throw new HttpException('No permission to update cover', 400)
      }

      const rooms = await RoomService.getRoomsByEstate(estate.id, true)

      const favoriteRooms = room.favorite
        ? [room]
        : filter(rooms.toJSON(), function (r) {
            return r.favorite
          })

      let favImages = this.extractImages(favoriteRooms, removeImage, addImage)

      // no cover or cover is no longer favorite image
      if (favImages && favImages.length) {
        if (!estate.cover || !favImages.find((i) => i.relativeUrl === estate.cover)) {
          await this.setCover(estate.id, favImages[0].relativeUrl, trx)
        }
      } else {
        let images = this.extractImages(rooms.toJSON(), removeImage)
        if (estate.cover) {
          if (
            images &&
            images.length &&
            images.find((i) => i.relativeUrl === estate.cover) === undefined
          ) {
            await this.setCover(estate.id, images[0].relativeUrl, trx)
          } else if (!images && !images.length) {
            await this.removeCover(estate.id, estate.cover, trx)
          }
        } else {
          if (images && images.length) {
            await this.setCover(estate.id, images[0].relativeUrl, trx)
          }
        }
      }
    } catch (e) {
      throw new HttpException(e.message, 500)
    }
  }

  static extractImages(rooms, removeImage = undefined, addImage = undefined) {
    let images = []

    rooms.map((r) => {
      if (addImage) {
        r.images.push(addImage.toJSON())
      }
      if (!r.images || !r.images.length) {
        return
      }
      images.push(r.images)
    })

    images = flatten(images)
    if (removeImage) {
      images = images.filter((i) => i.id !== removeImage.id)
    }

    return images
  }

  static async changeEstateCoverInFavorite(room, images, firstId, trx) {
    if (!images || !images.length) {
      return
    }

    const image = images.find((i) => i.id === firstId)
    await this.setCover(room.estate_id, image.relativeUrl, trx)
  }

  /**
   *
   */
  static async setCover(estateId, filePathName, trx = null) {
    const coverUpdateQuery = Estate.query().update({ cover: filePathName }).where('id', estateId)
    if (trx) {
      coverUpdateQuery.transacting(trx)
    }
    return await coverUpdateQuery
  }

  static async removeCover(estateId, filePathName, trx = null) {
    return await Estate.query()
      .update({ cover: null })
      .where('id', estateId)
      .where('cover', filePathName)
      .transacting(trx)
  }

  /**
   *
   */
  static async getEstateByHash(hash) {
    return Estate.query()
      .where('hash', hash)
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
      .first()
  }

  static getPublishedEstates(userID = null) {
    if (isEmpty(userID)) {
      return Estate.query()
    }

    return Estate.query()
      .where({ user_id: userID })
      .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
  }

  /**
   *
   */
  static async addLike(userId, estateId) {
    const estate = await this.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.into('likes').insert({ user_id: userId, estate_id: estateId })
      await this.removeDislike(userId, estateId)
    } catch (e) {
      Logger.error(e)
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeLike(userId, estateId, trx) {
    return Database.table('likes')
      .where({ user_id: userId, estate_id: estateId })
      .delete()
      .transacting(trx)
  }

  /**
   *
   */
  static async addDislike(userId, estateId, trx) {
    const shouldTrxProceed = trx

    if (!trx) {
      trx = await Database.beginTransaction()
    }

    const estate = await this.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.table('dislikes')
        .insert({ user_id: userId, estate_id: estateId })
        .transacting(trx)
      await this.removeLike(userId, estateId, trx)
      if (!shouldTrxProceed) await trx.commit()
    } catch (e) {
      Logger.error(e)
      if (!shouldTrxProceed) await trx.rollback()
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeDislike(userId, estateId) {
    return Database.table('dislikes').where({ user_id: userId, estate_id: estateId }).delete()
  }

  /**
   *
   */
  static searchEstatesQuery(tenant, radius) {
    return Database.select(Database.raw(`TRUE as inside`))
      .select('_e.*')
      .from({ _t: 'tenants' })
      .innerJoin({ _p: 'points' }, '_p.id', '_t.point_id')
      .crossJoin({ _e: 'estates' })
      .where('_t.user_id', tenant.user_id)
      .where('_e.status', STATUS_ACTIVE)
      .whereRaw(Database.raw(`_ST_Intersects(_p.zone::geometry, _e.coord::geometry)`))
  }

  /**
   *
   */
  static getEstatesByPointZoneQuery(pointId) {
    /*
      select estates.*
      from "estates"
        LEFT JOIN dislikes AS _d
          on estates.id = _d.estate_id AND _d.user_id = 1
      where
          _ST_Intersects(
              estates.coord::geometry,
              (select "_p"."zone" from "points" as "_p" where "_p"."id" = 1 limit 1)::geometry)
      and "status" = 1
      and "estates"."id" not in (select "estate_id" from "likes" where "user_id" = 1)
      ORDER BY COALESCE(_d.created_at, '2000-01-01') ASC, estates.id DESC
      limit 10
     */
    const zoneQuery = Database.from({ _p: 'points' })
      .select('_p.zone')
      .where({ '_p.id': pointId })
      .limit(1)

    return Estate.query().where(
      Database.raw(`_ST_Intersects(estates.coord::geometry, (${zoneQuery.toString()})::geometry)`)
    )
  }

  /**
   *
   */
  static getEstatesByPointCoordQuery(lat, lon) {
    const pointsQuery = Database.raw(
      `SELECT ST_Buffer(ST_MakePoint(?, ?)::geography, ?)::geometry`,
      [lon, lat, MAX_DIST]
    )

    const intersectQuery = Database.raw(
      `_ST_Intersects(estates.coord::geometry, (${pointsQuery.toString()})::geometry)`
    )

    return Estate.query().where(intersectQuery)
  }

  /**
   * Get estates according to es
   */
  static getActiveMatchesQuery(userId, exclude = []) {
    return Estate.query()
      .select('estates.*')
      .withCount('knocked', function (m) {
        m.whereNotIn('estate_id', exclude)
      })
      .select(Database.raw(`_m.percent AS match`))
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id')
          .onIn('_m.user_id', [userId])
          .onIn('_m.status', MATCH_STATUS_NEW)
      })
      .whereNot('_m.buddy', true)
      .where('estates.status', STATUS_ACTIVE)
      .whereNotIn('estates.id', exclude)
      .whereNotIn('estates.id', function () {
        // Remove already liked/disliked
        this.select('estate_id')
          .from('likes')
          .where('user_id', userId)
          .union(function () {
            this.select('estate_id').from('dislikes').where('user_id', userId)
          })
      })
      .with('rooms', function (b) {
        b.whereNot('status', STATUS_DELETE).with('images')
      })
      .with('files')
      .orderBy('_m.percent', 'DESC')
  }

  static async getTenantTrashEstates(userId) {
    // 2 cases for trash estates
    // Find the estates which the user has a match, but rented by another user
    // Find the estates which the user shared the info first, and then canceled the share
    // Find the estates which the user has been invited but there is no available time slot anymore
    // Find the estates which the user has a missed visit

    const allActiveMatches = await Match.query()
      .select('estate_id')
      .where('user_id', userId)
      .whereNotIn('status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW])
      .fetch()

    const estateIds = allActiveMatches.rows.map((m) => m.estate_id)

    const trashedEstates = await Estate.query()
      .select('*')
      .whereHas('matches', (estateQuery) => {
        estateQuery.where('matches.status', MATCH_STATUS_FINISH).whereIn('estates.id', estateIds)
      })
      .orWhereHas('matches', (estateQuery) => {
        estateQuery
          .whereIn('estates.id', estateIds)
          .whereIn('matches.status', [MATCH_STATUS_SHARE, MATCH_STATUS_TOP, MATCH_STATUS_COMMIT])
          .andWhere('matches.share', false)
          .andWhere('matches.user_id', userId)
      })
      .orWhere((estateQuery) => {
        estateQuery
          .whereIn('estates.id', estateIds)
          .whereHas('matches', (query) => {
            query.where('matches.status', MATCH_STATUS_INVITE).andWhere('matches.user_id', userId)
          })
          .whereDoesntHave('slots', (query) => {
            query.where('time_slots.end_at', '>=', moment().utc(new Date()).format(DATE_FORMAT))
          })
      })
      .orWhere((estateQuery) => {
        estateQuery
          .whereIn('estates.id', estateIds)
          .whereHas('matches', (query) => {
            query.where('matches.status', MATCH_STATUS_VISIT).andWhere('matches.user_id', userId)
          })
          .whereDoesntHave('visit_relations', (query) => {
            query
              .where('visits.user_id', userId)
              .andWhere('visits.start_date', '>=', moment().utc(new Date()).format(DATE_FORMAT))
          })
      })
      .fetch()
    return trashedEstates
  }

  /**
   * If tenant not active get points by zone/point+dist/range zone
   */
  static getNotActiveMatchesQuery(tenant, userId, excludeMin = 0, excludeMax = 0) {
    let query = null
    if (!tenant.coord_raw) {
      throw new AppException('Invalid user anchor')
    }

    if (!tenant.point_id) {
      const { lat, lon } = tenant.getLatLon()
      query = this.getEstatesByPointCoordQuery(lat, lon)
    } else if (tenant.zones && !isEmpty[tenant.zones]) {
      // TODO: Get apartments by user selected zones
    } else if (tenant.point_zone) {
      // Get apartments by zone
      query = this.getEstatesByPointZoneQuery(tenant.point_id)
    } else {
      // Get apartments by anchor coords
      query = this.getEstatesByPointCoordQuery(tenant.point_lat, tenant.point_lon)
    }

    if (!query) {
      throw new AppException('Invalid match query')
    }

    query.where({ status: STATUS_ACTIVE }).whereNotIn('estates.id', function () {
      // Remove already liked/disliked
      this.select('estate_id')
        .from('likes')
        .where('user_id', userId)
        .union(function () {
          this.select('estate_id').from('dislikes').where('user_id', userId)
        })
    })

    query.whereNotIn('estates.id', function () {
      // Remove already matched
      this.select('estate_id')
        .from('matches')
        .whereNot('status', MATCH_STATUS_NEW)
        .where('user_id', userId)
    })

    if (excludeMin && excludeMax) {
      query.whereNotBetween('estates.id', [excludeMin, excludeMax])
    }

    return (
      query
        .select('estates.*')
        .withCount('knocked')
        .with('rooms', function (b) {
          b.whereNot('status', STATUS_DELETE).with('images')
        })
        .with('files')
        .select(Database.raw(`'0' AS match`))
        // .orderByRaw("COALESCE(estates.updated_at, '2000-01-01') DESC")
        .orderBy('estates.id', 'DESC')
    )
  }

  /**
   *
   */
  static async getTenantAllEstates(
    userId,
    { exclude_from = 0, exclude_to = 0, exclude = [] },
    limit = 20
  ) {
    const tenant = await TenantService.getTenantWithGeo(userId)
    if (!tenant) {
      throw new AppException('Tenant geo invalid')
    }
    let query = null
    if (tenant.isActive()) {
      query = this.getActiveMatchesQuery(userId, isEmpty(exclude) ? undefined : exclude)
    } else {
      query = this.getNotActiveMatchesQuery(tenant, userId, exclude_from, exclude_to)
    }

    return query.limit(limit).fetch()
  }

  /**
   *
   */
  static async publishEstate(estate, request) {
    //TODO: We must add transaction here

    const trx = await Database.beginTransaction()
    try {
      const user = await User.query().where('id', estate.user_id).first()
      if (!user) return
      if (user.company_id != null) {
        await CompanyService.validateUserContacts(estate.user_id)
      }
      await props({
        delMatches: Database.table('matches')
          .where({ estate_id: estate.id })
          .delete()
          .transacting(trx),
        delLikes: Database.table('likes').where({ estate_id: estate.id }).delete().transacting(trx),
        delDislikes: Database.table('dislikes')
          .where({ estate_id: estate.id })
          .delete()
          .transacting(trx),
      })
      await estate.publishEstate(trx)
      logEvent(
        request,
        LOG_TYPE_PUBLISHED_PROPERTY,
        estate.user_id,
        { estate_id: estate.id },
        false
      )
      // Run match estate
      Event.fire('match::estate', estate.id)
      Event.fire('mautic:syncContact', estate.user_id, { published_property: 1 })
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 500)
    }
  }

  static async handleOfflineEstate(estateId, trx) {
    const matches = await Estate.query()
      .select('estates.*')
      .where('id', estateId)
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', estateId)
      })
      .select('_m.user_id as prospect_id')
      .whereNotIn('_m.status', [MATCH_STATUS_FINISH, MATCH_STATUS_NEW])
      .fetch()

    await Match.query()
      .where('estate_id', estateId)
      .whereNotIn('status', [MATCH_STATUS_FINISH])
      .delete()
      .transacting(trx)

    await Visit.query().where('estate_id', estateId).delete().transacting(trx)
    await Database.table('likes').where({ estate_id: estateId }).delete().transacting(trx)
    await Database.table('dislikes').where({ estate_id: estateId }).delete().transacting(trx)

    NoticeService.prospectPropertDeactivated(matches.rows)
  }

  static async getEstatesByUserId({ ids, limit = -1, page = -1, params = {} }) {
    if (page === -1 || limit === -1) {
      return await this.getEstates(params)
        .whereIn('user_id', ids)
        .whereNot('estates.status', STATUS_DELETE)
        .with('rooms')
        .with('current_tenant')
        .fetch()
    } else {
      return await this.getEstates(params)
        .whereIn('user_id', ids)
        .whereNot('estates.status', STATUS_DELETE)
        .paginate(page, limit)
    }
  }

  static async landlordTenantDetailInfo(user_id, estate_id, tenant_id) {
    return Estate.query()
      .select(['estates.*', '_m.share', '_m.status'])
      .with('user')
      .innerJoin({ _m: 'matches' }, function () {
        this.on('_m.estate_id', 'estates.id').on('_m.user_id', tenant_id)
        //.on('_m.status', MATCH_STATUS_FINISH)
      })
      .leftJoin({ _mb: 'members' }, function () {
        this.on('_mb.user_id', '_m.user_id')
      })
      .where('estates.id', estate_id)
      .where('estates.user_id', user_id)
      .orderBy('_mb.id')
      .firstOrFail()
  }

  /**
   * Soft deletes of estates
   */
  static async deleteEstates(ids, user_id, trx) {
    const affectedRows = await Estate.query(trx)
      .where('user_id', user_id)
      .whereIn('id', ids)
      .update({ status: STATUS_DELETE })
    if (affectedRows !== ids.length) {
      throw new AppException(
        'Number of rows deleted did not match number of properties to be deleted. Transaction was rolled back.'
      )
    }
    return affectedRows
  }

  static getCounts() {
    return Estate.query()
      .select(Database.raw(`count(*) as all_count`))
      .select(
        Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_LET}') as let_count`)
      )
      .select(
        Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_VOID}') as void_count`)
      )
      .select(Database.raw(`count(*) filter(where letting_type='${LETTING_TYPE_NA}') as na_count`))
  }

  static async getFilteredCounts(userId, params) {
    let query = EstateService.getCounts()
      .whereNot('estates.status', STATUS_DELETE)
      .where('user_id', userId)
    const Filter = new EstateFilters(params, query)
    query = Filter.process()
    let filteredCounts = await query.first()

    filteredCounts = omit(filteredCounts.toJSON(), [
      'hash',
      'coord',
      'coord_raw',
      'bath_options',
      'kitchen_options',
      'equipment',
      'verified_address',
    ])
    return filteredCounts
  }

  static async getTotalEstateCounts(userId) {
    let estateCount = await EstateService.getCounts()
      .where('user_id', userId)
      .whereNot('status', STATUS_DELETE)
      .first()
    estateCount = omit(estateCount.toJSON(), [
      'hash',
      'coord',
      'coord_raw',
      'bath_options',
      'kitchen_options',
      'equipment',
      'verified_address',
    ])
    return estateCount
  }

  static async getEstateHasTenant({ condition = {} }) {
    let query = Estate.query().where('letting_type', LETTING_TYPE_LET).where('status', STATUS_DRAFT)
    if (isEmpty(condition)) {
      return await query.first()
    }

    return await query.where(condition).first()
  }

  static async getIsolines(estate) {
    try {
      if (!estate.full_address && (estate.coord_raw || estate.coord)) {
        const coords = (estate.coord_raw || estate.coord).split(',')
        const lat = coords[0]
        const lon = coords[1]

        const isolinePoints = await GeoService.getOrCreateIsoline(
          { lat, lon },
          TRANSPORT_TYPE_WALK,
          60
        )

        return isolinePoints?.toJSON()?.data || []
      }
      return []
    } catch (e) {
      console.log(`getIsolines Error ${e.message}`)
      return []
    }
  }

  static async hasPermission({ id, user_id }) {
    try {
      return await Estate.findByOrFail({ id, user_id: user_id })
    } catch (e) {
      throw new HttpException(NO_ESTATE_EXIST, 400)
    }
  }

  static async getEstatesWithTask(user, params, page, limit = -1) {
    let query = Estate.query()
      .with('current_tenant', function (b) {
        b.with('user', function (u) {
          u.select('id', 'firstname', 'secondname', 'email', 'avatar')
        })
      })
      .with('tasks')
      .select(
        'estates.id',
        'estates.coord',
        'estates.street',
        'estates.area',
        'estates.house_number',
        'estates.country',
        'estates.floor',
        'estates.rooms_number',
        'estates.number_floors',
        'estates.city',
        'estates.cover',
        'estates.zip',
        'estates.coord_raw',
        'estates.property_id',
        'estates.net_rent',
        'estates.address',
        'estates.extra_address',
        Database.raw('COALESCE(max("tasks"."urgency"), -1) as "mosturgency" ')
      )

    query.leftJoin({ _ect: 'estate_current_tenants' }, function () {
      this.on('_ect.estate_id', 'estates.id').onIn('_ect.status', [STATUS_ACTIVE])
    })

    query.leftJoin({ _u: 'users' }, function () {
      this.on('_ect.user_id', '_u.id')
    })

    query.leftJoin('tasks', function () {
      this.on('estates.id', 'tasks.estate_id').onNotIn('tasks.status', [
        TASK_STATUS_DRAFT,
        TASK_STATUS_DELETE,
      ])
    })

    query.where('estates.user_id', user.id)
    query.whereNot('estates.status', STATUS_DELETE)
    query.where('estates.letting_type', LETTING_TYPE_LET)
    if (params.estate_id) {
      query.whereIn('estates.id', [params.estate_id])
    }

    const taskFilter = new TaskFilters(params, query)

    query.groupBy('estates.id')

    taskFilter.afterQuery()

    query.orderBy('mosturgency', 'desc')

    let result = null
    if (limit === -1 || page === -1) {
      result = await query.fetch()
    } else {
      result = await query.paginate(page, limit)
    }

    result = Object.values(groupBy(result.toJSON().data || result.toJSON(), 'id'))

    let estates = await Promise.all(
      result.map(async (r) => {
        r[0].activeTasks = (r[0].tasks || []).filter(
          (task) => task.status === TASK_STATUS_NEW || task.status === TASK_STATUS_INPROGRESS
        )

        const closed_tasks_count =
          (r[0].tasks || []).filter(
            (task) => task.status === TASK_STATUS_RESOLVED || task.status === TASK_STATUS_UNRESOLVED
          ).length || 0
        const in_progress_task =
          countBy(r[0].tasks || [], (task) => task.status === TASK_STATUS_INPROGRESS).true || 0

        const mostUrgency = maxBy(r[0].activeTasks, (re) => {
          return re.urgency
        })

        const mostUpdated =
          r[0].activeTasks && r[0].activeTasks.length ? r[0].activeTasks[0].updated_at : null

        r[0].tasks.map((task) => {
          task.unread_message_count =
            task.unread_role === ROLE_LANDLORD ? task.unread_count || 0 : 0
        })

        const has_unread_message = Estate.landlord_has_unread_messages(
          r[0].activeTasks || [],
          ROLE_LANDLORD
        )
        let activeTasks = (r[0].activeTasks || []).slice(0, SHOW_ACTIVE_TASKS_COUNT)

        const taskCount = (r[0].tasks || []).length || 0
        return {
          ...omit(r[0], ['activeTasks', 'mosturgency', 'tasks']),
          activeTasks: activeTasks,
          in_progress_task,
          mosturgency: mostUrgency?.urgency,
          most_task_updated: mostUpdated,
          has_unread_message,
          taskSummary: {
            taskCount,
            activeTaskCount: r[0].activeTasks.length || 0,
            closed_tasks_count,
            mostUrgency: mostUrgency?.urgency || null,
            mostUrgencyCount: mostUrgency
              ? countBy(r[0].activeTasks, (re) => re.urgency === mostUrgency.urgency).true || 0
              : 0,
          },
        }
      })
    )

    if (params && params.filter_by_unread_message) {
      estates = filter(estates, { has_unread_message: true })
    }

    let orderKeys = ['most_task_updated', 'mosturgency']
    let orderRules = ['desc', 'desc']

    if (params && params.order_by_unread_message) {
      orderKeys = ['has_unread_message', ...orderKeys]
      orderRules = ['desc', ...orderRules]
    }
    estates = orderBy(estates, orderKeys, orderRules)

    return estates
  }

  static async getQuickActionsCount(user_id) {
    const quickActions =
      (
        await Estate.query()
          .select(Database.raw(` DISTINCT("estates"."id")`))
          .select(Database.raw(` count( DISTINCT("_ut"."id" )) as "urgency_count"`))
          .select(Database.raw(` count( DISTINCT("_t"."id")) as unread_count`))
          .select(Database.raw(` count( DISTINCT("_tsi"."id")) as in_progress_count`))
          .select('_ect.user_id', '_ect.code', '_ect.invite_sent_at')
          .leftJoin({ _t: 'tasks' }, function () {
            this.on('estates.id', '_t.estate_id')
              .on('_t.unread_role', ROLE_LANDLORD)
              .on(Database.raw(`_t.unread_count > 0`))
              .on(Database.raw(`_t.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`))
              .onIn('_t.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
          })
          .leftJoin({ _ut: 'tasks' }, function () {
            this.on('estates.id', '_ut.estate_id')
              .on('_ut.urgency', URGENCY_SUPER)
              .on(Database.raw(`_ut.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`))
              .onIn('_ut.status', [TASK_STATUS_NEW, TASK_STATUS_INPROGRESS])
          })
          .leftJoin({ _tsi: 'tasks' }, function () {
            this.on('estates.id', '_tsi.estate_id').on('_tsi.status', TASK_STATUS_INPROGRESS)
          })
          .leftJoin({ _ect: 'estate_current_tenants' }, function () {
            this.on('_ect.estate_id', 'estates.id').on('_ect.status', STATUS_ACTIVE)
          })
          .where('estates.user_id', user_id)
          .where('estates.letting_type', LETTING_TYPE_LET)
          .whereNot('estates.status', STATUS_DELETE)
          .groupBy('estates.id', '_ect.id')
          .fetch()
      ).rows || []

    let urgency_count = 0
    let in_progress_count = 0
    let not_connected_count = 0
    let pending_count = 0
    let unread_count = 0
    let connected_count = 0

    quickActions.map((estate) => {
      urgency_count += parseInt(estate.urgency_count) || 0
      in_progress_count += parseInt(estate.in_progress_count) || 0
      unread_count += parseInt(estate.unread_count) || 0

      if (!estate.user_id) {
        if (
          estate.code != null &&
          moment.utc(estate.invite_sent_at).format('X') >=
            moment.utc(new Date()).subtract(TENANT_INVITATION_EXPIRATION_DATE, 'days').format('X')
        ) {
          pending_count++
        } else {
          not_connected_count++
        }
      } else {
        connected_count++
      }
    })

    return {
      urgency_count,
      in_progress_count,
      not_connected_count,
      pending_count,
      unread_count,
      connected_count,
    }
  }

  static async getTotalLetCount(user_id, params, filtering = true) {
    let query = Estate.query()
      .count('estates.*')
      .leftJoin('tasks', function () {
        this.on('estates.id', 'tasks.estate_id').on(
          Database.raw(`tasks.status not in (${[TASK_STATUS_DRAFT, TASK_STATUS_DELETE]})`)
        )
      })
      .leftJoin({ _ect: 'estate_current_tenants' }, function () {
        this.on('_ect.estate_id', 'estates.id').on('_ect.status', STATUS_ACTIVE)
      })
      .leftJoin({ _u: 'users' }, function () {
        this.on('_ect.user_id', '_u.id')
      })
      .where('estates.user_id', user_id)
      .where('estates.letting_type', LETTING_TYPE_LET)
      .whereNot('estates.status', STATUS_DELETE)

    if (!filtering) {
      query.groupBy('estates.id')
      return await query
    }
    const filter = new TaskFilters(params, query)
    query.groupBy('estates.id')
    filter.afterQuery()

    return await query
  }

  static async getLatestEstates(limit = 5) {
    return (
      await this.getQuery()
        .whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
        .select('id', 'city', 'cover')
        .orderBy('created_at', 'desc')
        .paginate(1, limit)
    ).rows
  }

  static async rented(estateId, trx) {
    // Make estate status DRAFT to hide from tenants' matches list
    await Database.table('estates')
      .where({ id: estateId })
      .update({ status: STATUS_DRAFT, letting_type: LETTING_TYPE_LET })
      .transacting(trx)
  }

  static async rentable(estateId, fromInvitation) {
    const estate = await Estate.query().where('id', estateId).firstOrFail()

    if (
      !fromInvitation &&
      (estate.letting_type === LETTING_TYPE_LET ||
        ![STATUS_ACTIVE, STATUS_EXPIRE].includes(estate.status))
    ) {
      throw new Error(
        "You can't rent this property because this property already has been delete or rented by someone else"
      )
    }
    return estate
  }

  static async unrented(estate_ids, trx = null) {
    let query = Estate.query()
      .whereIn('id', Array.isArray(estate_ids) ? estate_ids : [estate_ids])
      .whereNot('status', STATUS_DELETE)
      .where('letting_type', LETTING_TYPE_LET)
      .update({ letting_type: LETTING_TYPE_VOID })

    if (!trx) {
      return await query
    }
    return await query.transacting(trx)
  }

  static async checkCanChangeLettingStatus(result, option = {}) {
    const resultObject = result.toJSON(option)
    if (resultObject.data) {
      result = resultObject.data
    } else if (resultObject) {
      result = resultObject
    } else {
      result = []
    }
    return result.map((estate) => {
      const isMatchCountValidToChangeLettinType =
        0 + parseInt(estate.__meta__.visits_count) ||
        0 + parseInt(estate.__meta__.knocked_count) ||
        0 + parseInt(estate.__meta__.decided_count) ||
        0 + parseInt(estate.__meta__.invite_count) ||
        0 + parseInt(estate.__meta__.final_count) ||
        0

      return {
        ...estate,
        canChangeLettingType:
          isMatchCountValidToChangeLettinType || estate.current_tenant ? false : true,
      }
    })
  }

  static async hasEstate(user_id) {
    const estate = await Estate.query()
      .select('id')
      .where('user_id', user_id)
      .whereNot('status', STATUS_DELETE)
      .first()

    if (!estate) {
      return false
    }
    return true
  }

  static async importOpenimmo(importFile, user_id) {
    const filename = importFile.clientName
    const reader = new OpenImmoReader(importFile.tmpPath, importFile.headers['content-type'])
    const result = await reader.process()
    const trx = await Database.beginTransaction()
    try {
      await Promise.map(result, async (property) => {
        property.user_id = user_id
        property.status = STATUS_DRAFT
        let images = property.images
        const result = await Estate.createItem(omit(property, ['images']), trx)
        QueueService.uploadOpenImmoImages(images, result.id)
      })
      await Import.createItem({
        user_id,
        filename,
        type: IMPORT_TYPE_OPENIMMO,
        entity: IMPORT_ENTITY_ESTATES,
      })
      await trx.commit()
      return result
    } catch (err) {
      await trx.rollback()
      console.log(err.message)
      throw new HttpException('Error: '.err.message)
    }
  }

  static async deletePermanent(user_id) {
    await Estate.query().where('user_id', user_id).delete()
  }
}
module.exports = EstateService
