'use strict'
const moment = require('moment')
const { get, isArray, isEmpty } = require('lodash')

const Database = use('Database')
const Drive = use('Drive')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const TenantService = use('App/Services/TenantService')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const File = use('App/Models/File')
const AppException = use('App/Exceptions/AppException')

const { STATUS_DRAFT, STATUS_DELETE, STATUS_ACTIVE, MATCH_STATUS_NEW } = require('../constants')
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
    const query = Estate.query().where({ id, status: STATUS_ACTIVE })
    if (!isEmpty(conditions)) {
      query.where(conditions)
    }

    return query.first()
  }

  /**
   *
   */
  static async createEstate(data, userId) {
    return Estate.createItem({
      ...data,
      user_id: userId,
      status: STATUS_DRAFT,
    })
  }

  /**
   *
   */
  static getEstates(params = {}) {
    const query = Estate.query()
    if (params.query) {
      query.where(function () {
        this.orWhere('estates.street', 'ilike', `%${params.query}%`)
        this.orWhere('estates.property_id', 'ilike', `${params.query}%`)
      })
    }

    if (params.status) {
      query.where('estates.status', params.status)
    }

    return query.orderBy('estates.id', 'desc')
  }

  /**
   *
   */
  static async removeEstate(id) {
    // TODO: remove indexes
    return Estate.query().update({ status: STATUS_DELETE }).where('id', id)
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
      throw AppException('Estate address invalid')
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
    return Estate.query().where('hash', hash).where('status', STATUS_ACTIVE).first()
  }

  /**
   *
   */
  static async getTimeSlotsByEstate(estate) {
    return TimeSlot.query()
      .where('estate_id', estate.id)
      .orderBy([
        { column: 'week_day', order: 'ask' },
        { column: 'start_at', order: 'ask' },
      ])
      .limit(100)
      .fetch()
  }

  /**
   *
   */
  static async createSlot({ end_at, start_at, slot_length, week_day }, estate) {
    const minDiff = moment
      .utc(`2012-10-10 ${end_at}`)
      .diff(moment.utc(`2012-10-10 ${start_at}`), 'minutes')

    if (minDiff % slot_length !== 0) {
      throw new AppException('Invalid time range')
    }

    // Checks is time slot crossing existing
    const existing = await TimeSlot.query()
      .where('estate_id', estate.id)
      .where('week_day', week_day)
      .where(function () {
        this.whereBetween('start_at', [start_at, end_at])
          .orWhereBetween('end_at', [start_at, end_at])
          .orWhere(function () {
            this.where('start_at', '<=', start_at).where('end_at', '>=', end_at)
          })
      })
      .first()

    if (existing) {
      throw new AppException('Time slot crossing existing')
    }

    return TimeSlot.createItem({ week_day, end_at, start_at, slot_length, estate_id: estate.id })
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
    const minDiff = moment
      .utc(`2012-10-10 ${slot.end_at}`)
      .diff(moment.utc(`2012-10-10 ${slot.start_at}`), 'minutes')

    if (minDiff % slot.slot_length !== 0) {
      throw new AppException('Invalid time range')
    }

    const crossingSlot = await TimeSlot.query()
      .where('estate_id', slot.estate_id)
      .whereNot('id', slot.id)
      .where('week_day', slot.week_day)
      .where(function () {
        this.whereBetween('start_at', [slot.start_at, slot.end_at])
          .orWhereBetween('end_at', [slot.start_at, slot.end_at])
          .orWhere(function () {
            this.where('start_at', '<=', slot.start_at).where('end_at', '>=', slot.end_at)
          })
      })
      .first()

    if (crossingSlot) {
      throw new AppException('Time slot crossing existing')
    }
    await slot.save()

    return slot
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
    const { lat, lon } = tenant.getLatLon()
    const polygon = get(tenant, 'polygon.data.0.0')
    const polyStr = [...polygon, polygon[0]].map(([lon, lat]) => `${lon} ${lat}`).join(',')

    // Has poly, calculate intersection
    if (isArray(polygon) && polygon.length) {
      return Database.with(
        'meta',
        Database.raw(`SELECT 'SRID=4326;POLYGON((${polyStr}))'::geometry`)
      )
        .select('_e.*')
        .select(
          Database.raw(`_ST_Intersects(_e.coord::geometry, meta.geometry::geometry) as inside`)
        )
        .from({ _e: 'estates' })
        .crossJoin('meta')
        .whereRaw(`ST_DWithin(_e.coord, ST_MakePoint(?, ?)::geography, ?)`, [lon, lat, radius])
      // .whereBetween('_e.floor', [tenant.floor_min, tenant.floor_max])
      // .whereIn('_e.apt_type', tenant.apt_type)
      // .whereIn('_e.id', [8])
    }

    // No poly / get all points in gray zone circle
    return Database.from({ _e: 'estates' })
      .select('_e.*', Database.raw(`FALSE as inside`))
      .whereRaw(`ST_DWithin(_e.coord, ST_MakePoint(?, ?)::geography, ?)`, [lon, lat, radius])
      .whereBetween('_e.floor', [tenant.floor_min, tenant.floor_max])
      .whereIn('_e.apt_type', tenant.apt_type)
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

    return Estate.query().where(pointsQuery)
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
  }

  /**
   * If tenant not active get points by zone/point+dist/range zone
   */
  static getNotActiveMatchesQuery(tenant, userId, excludeMin = 0, excludeMax = 0) {
    let query = null
    if (!tenant.point_lat || !tenant.point_lon) {
      throw new AppException('Invalid user anchor')
    }

    if (tenant.zones && !isEmpty[tenant.zones]) {
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

    if (excludeMin && excludeMax) {
      query.whereNotBetween('estates.id', [excludeMin, excludeMax])
    }

    return query
      .select('estates.*')
      .select(
        Database.raw(`CASE WHEN _d.created_at IS NOT NULL THEN TRUE ELSE FALSE END AS dislike`)
      )
      .select(Database.raw(`'0' AS match`))
      .leftJoin({ _d: 'dislikes' }, function () {
        this.on('_d.estate_id', 'estates.id').onIn('_d.user_id', [userId])
      })
      .orderByRaw("COALESCE(_d.created_at, '2000-01-01') ASC")
      .orderBy('estates.id', 'DESC')
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
    let query = null

    if (tenant.isActive()) {
      query = EstateService.getActiveMatchesQuery(userId, isEmpty(exclude) ? undefined : exclude)
    } else {
      query = EstateService.getNotActiveMatchesQuery(tenant, userId, exclude_from, exclude_to)
    }

    return query.limit(limit).fetch()
  }
}

module.exports = EstateService
