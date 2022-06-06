'use strict'
const moment = require('moment')
const { get, isEmpty, findIndex, range, filter, omit, flatten } = require('lodash')
const { props } = require('bluebird')

const Database = use('Database')
const Drive = use('Drive')
const Event = use('Event')
const Logger = use('Logger')
const TenantService = use('App/Services/TenantService')
const CompanyService = use('App/Services/CompanyService')
const NoticeService = use('App/Services/NoticeService')
const RoomService = use('App/Services/RoomService')
const QueueService = use('App/Services/QueueService')

const Estate = use('App/Models/Estate')
const Match = use('App/Models/Match')
const Visit = use('App/Models/Visit')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const TimeSlot = use('App/Models/TimeSlot')
const File = use('App/Models/File')
const FileBucket = use('App/Classes/File')
const AppException = use('App/Exceptions/AppException')

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
  MAX_SEARCH_ITEMS,
} = require('../constants')
const { logEvent } = require('./TrackingService')
const HttpException = use('App/Exceptions/HttpException')
const EstateFilters = require('../Classes/EstateFilters')
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
  static async createEstate(request, userId) {
    const data = request.all()
    const files = await this.saveEnergyProof(request)

    const propertyId = data.property_id
      ? data.property_id
      : Math.random().toString(36).substr(2, 8).toUpperCase()

    let createData = {
      ...omit(data, ['rooms']),
      user_id: userId,
      property_id: propertyId,
      status: STATUS_DRAFT,
    }

    if (files && files.energy_proof) {
      createData = {
        ...createData,
        energy_proof: files.energy_proof,
      }
    }

    const estate = await Estate.createItem({
      ...createData,
    })

    const estateHash = await Estate.query().select('hash').where('id', estate.id).firstOrFail()

    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)

    const estateData = await estate.toJSON({ isOwner: true })
    return {
      hash: estateHash.hash,
      ...estateData,
    }
  }

  static async updateEstate(request) {
    const { ...data } = request.all()

    let updateData = {
      ...omit(data, ['delete_energy_proof', 'rooms']),
      status: STATUS_DRAFT,
    }

    let energy_proof = null
    if (data.delete_energy_proof) {
      const estate = await this.getById(data.id)
      energy_proof = estate?.energy_proof

      updateData = {
        ...updateData,
        energy_proof: null,
      }
    } else {
      const files = await this.saveEnergyProof(request)
      if (files && files.energy_proof) {
        updateData = {
          ...updateData,
          energy_proof: files.energy_proof,
        }
      }
    }

    const estate = await EstateService.getQuery()
      .where('id', data.id)
      .update({
        ...updateData,
      })

    if (data.delete_energy_proof && energy_proof) {
      FileBucket.remove(energy_proof)
    }
    // Run processing estate geo nearest
    QueueService.getEstatePoint(estate.id)
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
  static async removeEstate(id) {
    // TODO: remove indexes
    return Estate.query().update({ status: STATUS_DELETE }).where('id', id)
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

  /**
   *
   */
  static async getTimeSlotsByEstate(estate) {
    return TimeSlot.query()
      .where('estate_id', estate.id)
      .orderBy([{ column: 'start_at', order: 'ask' }])
      .limit(100)
      .fetch()
  }

  /**
   *
   */
  static getCrossTimeslotQuery({ end_at, start_at }, userId) {
    return TimeSlot.query()
      .whereIn('estate_id', function () {
        this.select('id').from('estates').where('user_id', userId)
      })
      .where(function () {
        this.orWhere(function () {
          this.where('start_at', '>', start_at).where('start_at', '<', end_at)
        })
          .orWhere(function () {
            this.where('end_at', '>', start_at).where('end_at', '<', end_at)
          })
          .orWhere(function () {
            this.where('start_at', '<=', start_at).where('end_at', '>=', end_at)
          })
      })
  }

  /**
   *
   */
  static async createSlot({ end_at, start_at, slot_length }, estate) {
    if (slot_length) {
      const minDiff = moment.utc(end_at).diff(moment.utc(start_at), 'minutes')
      if (minDiff % slot_length !== 0) {
        throw new AppException('Invalid time range')
      }
    }

    // Checks is time slot crossing existing
    const existing = await this.getCrossTimeslotQuery({ end_at, start_at }, estate.user_id).first()

    if (existing) {
      throw new AppException('Time slot crossing existing')
    }

    return TimeSlot.createItem({ end_at, start_at, slot_length, estate_id: estate.id })
  }

  /**
   *
   */
  static async getTimeSlotByOwner(userId, slotId) {
    return TimeSlot.query()
      .select('time_slots.*')
      .innerJoin({ _e: 'estates' }, '_e.id', 'time_slots.estate_id')
      .where('_e.user_id', userId)
      .where('time_slots.id', slotId)
      .first()
  }

  /**
   * Check if existing slot after update will not cross another existing slots
   */
  static async updateSlot(slot, data) {
    slot.merge(data)
    if (slot.slot_length) {
      const minDiff = moment.utc(slot.end_at).diff(moment.utc(slot.start_at), 'minutes')
      if (minDiff % slot.slot_length !== 0) {
        throw new AppException('Invalid time range')
      }
    }
    const estate = await Estate.find(slot.estate_id)
    const crossingSlot = await this.getCrossTimeslotQuery(
      { end_at: slot.end_at, start_at: slot.start_at },
      estate.user_id
    )
      .whereNot('id', slot.id)
      .first()

    if (crossingSlot) {
      throw new AppException('Time slot crossing existing')
    }
    await slot.save()

    return slot
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
      .limit(MAX_SEARCH_ITEMS)
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
    /*
      SELECT _e.*
      FROM estates AS _e
      WHERE
        _ST_Intersects(
            _e.coord::geometry, (SELECT ST_Buffer(ST_MakePoint(13.3987, 52.5013)::geography, 200000)::geometry)
          );
     */

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
   * If tenant zone exists, make estate requests by tenant zone
   */
  static getEstatesByTenantZoneQuery(tenantId) {
    // const zoneQuery = Database.from({ _t: 'tenants' })
    //   .select('_t.zone')
    //   .where({ '_t.id': tenantId })
    //   .limit(1)
    //
    // return Estate.query().where(
    //   Database.raw(`_ST_Intersects(estates.coord::geometry, (${zoneQuery.toString()})::geometry)`)
    // )
  }

  /**
   * Get estates according to matches
   */
  static getActiveMatchesQuery(userId, exclude = []) {
    /*
      SELECT
        _e.*,
        _m.percent AS match
      FROM estates AS _e
        INNER JOIN matches AS _m on _e.id = _m.estate_id AND _m.user_id = 1 --AND _m.status = 1
      WHERE
        _e.id NOT IN (1,2)
        AND _e.id NOT IN (
          SELECT _d.estate_id FROM dislikes AS _d WHERE _d.user_id = 1
          UNION SELECT _l.estate_id FROM likes AS _l WHERE _l.user_id = 1
        )
      order by _m.percent DESC
     */

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
    const User = use('App/Models/User')
    const user = await User.query().where('id', estate.user_id).first()
    if (!user) return
    if (user.company_id != null) {
      await CompanyService.validateUserContacts(estate.user_id)
    }
    await props({
      delMatches: Database.table('matches').where({ estate_id: estate.id }).delete(),
      delLikes: Database.table('likes').where({ estate_id: estate.id }).delete(),
      delDislikes: Database.table('dislikes').where({ estate_id: estate.id }).delete(),
    })
    await estate.publishEstate()
    logEvent(request, LOG_TYPE_PUBLISHED_PROPERTY, estate.user_id, { estate_id: estate.id }, false)
    // Run match estate
    Event.fire('match::estate', estate.id)
    Event.fire('mautic:syncContact', estate.user_id, { published_property: 1 })
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

  static async getEstatesByUserId(ids, limit, page, params) {
    if (params.return_all && params.return_all == 1) {
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

  /**
   *
   */
  static async getFreeTimeslots(estateId) {
    const dateFrom = moment().format(DATE_FORMAT)
    // Get estate available slots
    const getSlots = async () => {
      return Database.table('time_slots')
        .select('slot_length')
        .select(Database.raw('extract(epoch from start_at) as start_at'))
        .select(Database.raw('extract(epoch from end_at) as end_at'))
        .where({ estate_id: estateId })
        .where('start_at', '>=', dateFrom)
        .orderBy('start_at')
        .limit(500)
    }

    // Get estate visits (booked time units)
    const getVisits = async () => {
      return Database.table('visits')
        .select(Database.raw('extract(epoch from date) as visit_date'))
        .where({ estate_id: estateId })
        .where('date', '>=', dateFrom)
        .orderBy('date')
        .limit(500)
    }

    let { slots, visits } = await props({
      slots: getSlots(),
      visits: getVisits(),
    })

    // If slot_length is zero, so users are able to book unlimited slot
    const slotsWithoutLength = slots.filter(({ slot_length }) => slot_length === null)
    slots = slots.filter(({ slot_length }) => slot_length)

    // Split existing time ranges by booked time units
    visits.forEach(({ visit_date }) => {
      let index = findIndex(
        slots,
        ({ start_at, end_at }) => visit_date >= start_at && visit_date < end_at
      )
      // If found time range, split in
      if (index !== -1) {
        const slot = slots[index]
        slots.splice(index, 1)
        if (slot.start_at < visit_date) {
          const newItem = {
            start_at: slot.start_at,
            end_at: visit_date,
            slot_length: slot.slot_length,
          }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
          index += 1
        }
        if (visit_date + slot.slot_length * 60 < slot.end_at) {
          const newItem = {
            start_at: visit_date + slot.slot_length * 60,
            end_at: slot.end_at,
            slot_length: slot.slot_length,
          }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
        }
      }
    })

    const combinedSlots = [...slots, ...slotsWithoutLength]

    // Split slot ranges by slot units
    let result = {}
    combinedSlots.forEach((s) => {
      const day = moment.utc(s.start_at, 'X').startOf('day').format('X')
      // if slot_length is null, so show only 1 slot for date range
      const step = s.slot_length ? s.slot_length * 60 : s.end_at - s.start_at
      const items = range(s.start_at, s.end_at, step)
      console.log({ items })
      items.forEach((i) => {
        const items = [...get(result, day, []), { from: i, to: i + step }]
        result = { ...result, [day]: items }
      })
    })

    return result
  }

  static async lanlordTenantDetailInfo(user_id, estate_id, tenant_id) {
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
}

module.exports = EstateService
