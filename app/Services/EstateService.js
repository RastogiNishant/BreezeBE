'use strict'
const moment = require('moment')
const { get, isArray, isEmpty } = require('lodash')

const Database = use('Database')
const Drive = use('Drive')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const Estate = use('App/Models/Estate')
const TimeSlot = use('App/Models/TimeSlot')
const File = use('App/Models/File')
const AppException = use('App/Exceptions/AppException')

const { STATUS_DRAFT, STATUS_DELETE, STATUS_ACTIVE } = require('../constants')

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
}

module.exports = EstateService
