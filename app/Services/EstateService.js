'use strict'
const moment = require('moment')
const { get, isNumber, isArray } = require('lodash')

const Database = use('Database')
const Drive = use('Drive')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const Estate = use('App/Models/Estate')
const Tenant = use('App/Models/Tenant')
const Like = use('App/Models/Like')
const TimeSlot = use('App/Models/TimeSlot')
const File = use('App/Models/File')
const AppException = use('App/Exceptions/AppException')

const { STATUS_DRAFT, STATUS_DELETE, STATUS_ACTIVE } = require('../constants')

const MATCH_PERCENT_PASS = 50

/**
 * Check is item in data range
 */
const inRange = (value, start, end) => {
  if (!isNumber(+value) || !isNumber(+start) || !isNumber(+end)) {
    return false
  }

  return +start <= +value && +value <= +end
}

/**
 *
 */
class EstateService {
  /**
   *
   */
  static getEstateQuery() {
    return Estate.query()
  }

  static getActiveEstateQuery() {
    return Estate.query().whereNot('status', STATUS_DELETE)
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
    const estate = await EstateService.getEstateQuery().where('id', estateId).first()
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
      await Like.createItem({ user_id: userId, estate_id: estateId })
    } catch (e) {
      console.log(e)
      Logger.error(e)
      throw new AppException('Cant create like')
    }
  }

  /**
   *
   */
  static async removeLike(userId, estateId) {
    return Like.query().where({ user_id: userId, estate_id: estateId }).delete()
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
        .whereBetween('_e.floor', [tenant.floor_min, tenant.floor_max])
        .whereIn('_e.apt_type', tenant.apt_type)
    }

    // No poly / get all points in gray zone circle
    return Database.from({ _e: 'estates' })
      .select('_e.*', Database.raw(`FALSE as inside`))
      .whereRaw(`ST_DWithin(_e.coord, ST_MakePoint(?, ?)::geography, ?)`, [lon, lat, radius])
      .whereBetween('_e.floor', [tenant.floor_min, tenant.floor_max])
      .whereIn('_e.apt_type', tenant.apt_type)
  }

  /**
   * Get estates by geometry amd match it to current tenant
   */
  static async matchEstates(userId) {
    const tenant = await Tenant.query()
      .select('tenants.*', '_p.data as polygon')
      .where({ 'tenants.user_id': userId })
      .innerJoin({ _p: 'points' }, '_p.id', 'tenants.point_id')
      .first()
    const polygon = get(tenant, 'polygon.data.0.0')
    if (!tenant || !polygon) {
      throw new AppException('Invalid tenant filters')
    }

    let maxLat = -90,
      maxLon = -180,
      minLat = 90,
      minLon = 180

    polygon.forEach(([lon, lat]) => {
      maxLat = Math.max(lat, maxLat)
      maxLon = Math.max(lon, maxLon)
      minLat = Math.min(lat, minLat)
      minLon = Math.min(lon, minLon)
    })

    // Max radius
    const dist = GeoService.getPointsDistance(maxLat, maxLon, minLat, minLon) / 2
    const estates = await EstateService.searchEstatesQuery(tenant, dist).limit(500)

    const matched = estates.reduce((n, v) => {
      const percent = EstateService.calculateMatchPercent(tenant, v)
      if (percent >= MATCH_PERCENT_PASS) {
        return [...n, { estate_id: v.id, percent }]
      }
      return n
    }, [])

    console.log(matched)
  }

  /**
   *
   */
  static calculateMatchPercent(tenant, estate) {
    // Props weight
    const areaWeight = 1
    const roomsNumberWeight = 1
    const aptTypeWeight = 1
    const floorWeight = 1
    const houseTypeWeight = 1
    const gardenWeight = 1
    const budgetWeight = 1
    const geoInsideWeight = 1
    const geoOutsideWeight = 0.5
    const ageWeight = 1
    const rentArrearsWeight = 1

    let score = 0
    // Geo position
    score += estate.inside ? geoInsideWeight : geoOutsideWeight
    // Is area in range
    score += inRange(estate.area, tenant.space_min, tenant.space_max) ? areaWeight : 0
    // Rooms number in range
    score += inRange(estate.rooms_number, tenant.rooms_min, tenant.rooms_max)
      ? roomsNumberWeight
      : 0
    // Apartment type is equal
    score += tenant.apt_type.includes(estate.apt_type) ? aptTypeWeight : 0
    // Apt floor in range
    score += inRange(estate.floor, tenant.floor_min, tenant.floor_max) ? floorWeight : 0
    // House type is equal
    score += tenant.house_type.includes(estate.house_type) ? houseTypeWeight : 0
    // Garden exists
    // TODO: check this
    score += gardenWeight
    // Rent amount weight
    const rentAmount = tenant.include_utility
      ? estate.net_rent + (estate.additional_costs || 0)
      : estate.net_rent
    const budgetPass =
      (tenant.income / rentAmount) * 100 >= Math.min(estate.budget, tenant.budget_max)
    score += budgetPass ? budgetWeight : 0

    // Get is members with age
    if (estate.min_age && estate.max_age && tenant.members_age) {
      const isInRange = (tenant.members_age || []).reduce((n, v) => {
        return n ? true : inRange(v, estate.min_age, estate.max_age)
      }, false)
      score += isInRange ? ageWeight : 0
    }

    // Tenant has rent arrears
    score += estate.rent_arrears && tenant.unpaid_rental ? 0 : rentArrearsWeight

    // Check family status
    if (estate.fa)

    console.log({ score })
    return 50
  }
}

module.exports = EstateService
