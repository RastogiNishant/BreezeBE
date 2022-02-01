'use strict'
const moment = require('moment')
const { get, isEmpty, findIndex, range, isArray, size } = require('lodash')
const { props } = require('bluebird')

const Database = use('Database')
const Drive = use('Drive')
const Event = use('Event')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const TenantService = use('App/Services/TenantService')
const CompanyService = use('App/Services/CompanyService')
const NoticeService = use('App/Services/NoticeService')
// const MatchService = use('App/Services/MatchService') # DO NOT INCLUDE, cycling dependencies
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const File = use('App/Models/File')
const AppException = use('App/Exceptions/AppException')

const {
  STATUS_DRAFT,
  STATUS_DELETE,
  STATUS_ACTIVE,
  MATCH_STATUS_NEW,
  STATUS_EXPIRE,
  DATE_FORMAT,
  LOG_TYPE_PUBLISHED_PROPERTY,
} = require('../constants')
const { logEvent } = require('./TrackingService')
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

  /**
   *
   */
  static async getActiveById(id, conditions = {}) {
    const query = Estate.query().where({ id }).whereIn('status', [STATUS_ACTIVE, STATUS_EXPIRE])
    if (!isEmpty(conditions)) {
      query.where(conditions)
    }

    return query.first()
  }

  /**
   *
   */
  static async createEstate(data, userId) {
    const propertyId = data.property_id
      ? data.property_id
      : Math.random().toString(36).substr(2, 8).toUpperCase()
    return Estate.createItem({
      ...data,
      user_id: userId,
      property_id: propertyId,
      status: STATUS_DRAFT,
    })
  }

  /**
   *
   */
  static getEstates(params = {}) {
    const query = Estate.query()
      .withCount('visits')
      .withCount('decided')
      .withCount('invite')
      .withCount('inviteBuddies')
    if (params.query) {
      query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
      })
    }

    if (params.status) {
      query.whereIn('estates.status', isArray(params.status) ? params.status : [params.status])
    }

    // if(params.filter && params.filter.includes(1)) {
    //   query.whereHas('inviteBuddies')
    // }
    if (params.filter) {
      query.whereHas('matches', (query) => {
        query.whereIn('status', params.filter)
      })
    }

    return query.orderBy('estates.id', 'desc')
  }

  /**
   *
   */
  static getUpcomingShows(ids, query = '') {
    // const timeSlot = TimeSlot.query()

    // if(query.length > 0 ) {
    //   timeSlot
    //   .whereHas('user', (estateQuery) => {
    //               estateQuery.where('address', 'ILIKE', `%${query}%`)
    //             })
    // }

    // return timeSlot
    return EstateService.getEstates()
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
    return await Estate.query().where('id', id).delete()
  }

  /**
   *
   */
  static async updateEstatePoint(estateId) {
    const estate = await EstateService.getQuery().where('id', estateId).first()
    if (!estate) {
      throw new AppException(`Invalid estate ${estateId}`)
    }

    const { lat, lon } = estate.getLatLon()
    if (+lat === 0 && +lon === 0) {
      return false
    }
    const point = await GeoService.getOrCreatePoint({ lat, lon })
    estate.point_id = point.id

    return estate.save()
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
  static async updateEstateCoord(estateId) {
    const estate = await Estate.findOrFail(estateId)
    if (!estate.address) {
      throw new AppException('Estate address invalid')
    }

    const result = await GeoService.geeGeoCoordByAddress(estate.address)
    if (result) {
      await estate.updateItem({ coord: `${result.lat},${result.lon}` })
      await EstateService.updateEstatePoint(estateId)
    }
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

  /**
   *
   */
  static async setCover(estateId, filePathName) {
    return Estate.query().update({ cover: filePathName }).where('id', estateId)
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
    const minDiff = moment.utc(end_at).diff(moment.utc(start_at), 'minutes')
    if (minDiff % slot_length !== 0) {
      throw new AppException('Invalid time range')
    }

    // Checks is time slot crossing existing
    const existing = await EstateService.getCrossTimeslotQuery(
      { end_at, start_at },
      estate.user_id
    ).first()

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
    const minDiff = moment.utc(slot.end_at).diff(moment.utc(slot.start_at), 'minutes')
    if (minDiff % slot.slot_length !== 0) {
      throw new AppException('Invalid time range')
    }
    const estate = await Estate.find(slot.estate_id)
    const crossingSlot = await EstateService.getCrossTimeslotQuery(
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
    const estate = await EstateService.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.into('likes').insert({ user_id: userId, estate_id: estateId })
      await EstateService.removeDislike(userId, estateId)
    } catch (e) {
      Logger.error(e)
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeLike(userId, estateId) {
    return Database.table('likes').where({ user_id: userId, estate_id: estateId }).delete()
  }

  /**
   *
   */
  static async addDislike(userId, estateId) {
    const estate = await EstateService.getActiveEstateQuery().where({ id: estateId }).first()
    if (!estate) {
      throw new AppException('Invalid estate')
    }

    try {
      await Database.into('dislikes').insert({ user_id: userId, estate_id: estateId })
      await EstateService.removeLike(userId, estateId)
    } catch (e) {
      Logger.error(e)
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
      .limit(1000)
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
      query = EstateService.getEstatesByPointCoordQuery(lat, lon)
    } else if (tenant.zones && !isEmpty[tenant.zones]) {
      // TODO: Get apartments by user selected zones
    } else if (tenant.point_zone) {
      // Get apartments by zone
      query = EstateService.getEstatesByPointZoneQuery(tenant.point_id)
    } else {
      // Get apartments by anchor coords
      query = EstateService.getEstatesByPointCoordQuery(tenant.point_lat, tenant.point_lon)
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
      query = EstateService.getActiveMatchesQuery(userId, isEmpty(exclude) ? undefined : exclude)
    } else {
      query = EstateService.getNotActiveMatchesQuery(tenant, userId, exclude_from, exclude_to)
    }

    return query.limit(limit).fetch()
  }

  /**
   *
   */
  static async moveJobsToExpire() {
    // Find jobs with expired date and status active
    const estateIds = (
      await Estate.query()
        .select('id')
        .where('status', STATUS_ACTIVE)
        .where('available_date', '<=', moment().format(DATE_FORMAT))
        .limit(100)
        .fetch()
    ).rows.map((i) => i.id)

    if (isEmpty(estateIds)) {
      return false
    }

    const trx = await Database.beginTransaction()
    try {
      // Update job status
      await Estate.query()
        .update({ status: STATUS_EXPIRE })
        .whereIn('id', estateIds)
        .transacting(trx)

      // Remove estates from - matches / likes / dislikes
      await Database.table('matches')
        .where('status', MATCH_STATUS_NEW)
        .whereIn('estate_id', estateIds)
        .delete()
        .transacting(trx)
      await Database.table('likes').whereIn('estate_id', estateIds).delete().transacting(trx)
      await Database.table('dislikes').whereIn('estate_id', estateIds).delete().transacting(trx)

      await NoticeService.landLandlordEstateExpired(estateIds)
    } catch (e) {
      await trx.rollback()
      Logger.error(e)
      return false
    }

    await trx.commit()
  }

  /**
   *
   */
  static async publishEstate(estate, request) {
    const User = use('App/Models/User')
    const user = await User.query().where('id', estate.user_id).first()
    if (!user) return
    if (user.company_id != null) {
      await CompanyService.validateUserContacts(estate.user_id)
    }
    await props({
      delMatches: () => Database.table('matches').where({ estate_id: estate.id }).delete(),
      delLikes: () => Database.table('likes').where({ estate_id: estate.id }).delete(),
      delDislikes: () => Database.table('dislikes').where({ estate_id: estate.id }).delete(),
    })
    await estate.publishEstate()
    logEvent(request, LOG_TYPE_PUBLISHED_PROPERTY, estate.user_id, { estate_id: estate.id }, false)
    // Run match estate
    Event.fire('match::estate', estate.id)
  }

  static async getEstatesByUserId(ids, limit, page, params) {
    return await EstateService.getEstates(params)
      .whereIn('user_id', ids)
      .whereNot('status', STATUS_DELETE)
      .whereNot('area', 0)
      .paginate(page, limit)
  }

  /**
   *
   */
  static async getFreeTimeslots(estateId) {
    const dateFrom = moment().format(DATE_FORMAT)
    // Get estate available slots
    const getSlots = async () => {
      return Database.table('time_slots')
        .select('slot_length as sl')
        .select(Database.raw('extract(epoch from start_at) as b'))
        .select(Database.raw('extract(epoch from end_at) as e'))
        .where({ estate_id: estateId })
        .where('start_at', '>=', dateFrom)
        .orderBy('start_at')
        .limit(500)
    }

    // Get estate visits (booked time units)
    const getVisits = async () => {
      return Database.table('visits')
        .select(Database.raw('extract(epoch from date) as d'))
        .where({ estate_id: estateId })
        .where('date', '>=', dateFrom)
        .orderBy('date')
        .limit(500)
    }

    let { slots, visits } = await props({
      slots: getSlots(),
      visits: getVisits(),
    })

    // Split existing time ranges by booked time units
    visits.forEach(({ d }) => {
      let index = findIndex(slots, ({ b, e }) => d >= b && d < e)
      // If found time range, split in
      if (index !== -1) {
        const slot = slots[index]
        slots.splice(index, 1)
        if (slot.b < d) {
          const newItem = { b: slot.b, e: d, sl: slot.sl }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
          index += 1
        }
        if (d + slot.sl * 60 < slot.e) {
          const newItem = { b: d + slot.sl * 60, e: slot.e, sl: slot.sl }
          slots = [...slots.slice(0, index), newItem, ...slots.slice(index, 500)]
        }
      }
    })

    // Split slot ranges by slot units
    let result = {}
    slots.forEach((s) => {
      const day = moment.utc(s.b, 'X').startOf('day').format('X')
      const step = s.sl * 60
      const items = range(s.b, s.e, step)
      items.forEach((i) => {
        const items = [...get(result, day, []), { from: i, to: i + step }]
        result = { ...result, [day]: items }
      })
    })

    return result
  }
}

module.exports = EstateService
