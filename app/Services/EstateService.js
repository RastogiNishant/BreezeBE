'use strict'
const Database = use('Database')
const Drive = use('Drive')
const Logger = use('Logger')
const GeoService = use('App/Services/GeoService')
const Estate = use('App/Models/Estate')
const File = use('App/Models/File')
const AppException = use('App/Exceptions/AppException')

const { STATUS_DRAFT, STATUS_DELETE, STATUS_ACTIVE } = require('../constants')

class EstateService {
  /**
   *
   */
  static getEstateQuery() {
    return Estate.query().select('estates.*', Database.gis.asGeoJSON('coord').as('coord'))
  }

  /**
   *
   */
  static async createEstate({ coord, ...data }, userId) {
    const [lat, lon] = String(coord).split(',')
    let point = null
    if (lat && lon) {
      point = Database.gis.setSRID(Database.gis.point(lon, lat), 4326)
    }

    return Estate.createItem({
      ...data,
      coord: point,
      user_id: userId,
      status: STATUS_DRAFT,
    })
  }

  /**
   *
   */
  static getEstates(params = {}) {
    const query = Estate.query().select('*', Database.gis.asGeoJSON('coord'))
    if (params.query) {
      query.where(function () {
        this.orWhere('street', 'ilike', `%${params.query}%`)
        this.orWhere('property_id', 'ilike', `${params.query}%`)
      })
    }

    if (params.status) {
      query.where('status', params.status)
    }

    return query.orderBy('id', 'desc')
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
}

module.exports = EstateService
