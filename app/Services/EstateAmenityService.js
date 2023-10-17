'use strict'

const Database = use('Database')
const { STATUS_ACTIVE, ESTATE_AMENITY_LOCATIONS, MANDATORY_AMENITIES } = require('../constants')
const Promise = require('bluebird')
const { omit } = require('lodash')
const HttpException = require('../Exceptions/HttpException')
const Amenity = use('App/Models/Amenity')
const Option = use('App/Models/Option')
class EstateAmenityService {
  static async getByEstate({ estate_id, location }) {
    let subQuery = `(select amenities.*,
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
         and estate_id='${estate_id}'
         and status='${STATUS_ACTIVE}'`

    if (!location) {
      subQuery += ` and location<>'room' `
    }

    subQuery += `) as damenities`

    const query = Database.select(
      Database.raw(`location, json_agg(damenities.* order by sequence_order desc) as amenities`)
    )
      .from(Database.raw(subQuery))
      .where('estate_id', estate_id)
      .where('status', STATUS_ACTIVE)

    if (location) {
      query.where('location', location)
    }

    return await query.groupBy('location')
  }

  static async getAmenity({ estate_id, option_id, type }) {
    const query = Amenity.query()
    if (estate_id) {
      query.where('estate_id', estate_id)
    }

    if (option_id) {
      query.where('option_id', option_id)
    }

    if (type) {
      query.where('type', type)
    }

    return await query.first()
  }

  static async handleSingleAmenity(amenity, trx) {
    amenity = {
      ...amenity,
      status: STATUS_ACTIVE
    }

    const amenityEntity = await this.getAmenity({
      estate_id: amenity.estate_id,
      option_id: amenity.option_id,
      type: amenity.type
    })

    if (amenityEntity) {
      await Amenity.query()
        .where('id', amenityEntity.estate_id)
        .update({ ...omit(amenity, ['id']) })
        .transacting(trx)
    } else {
      await Amenity.createItem(amenity, trx)
    }
  }

  static async handleMultipleAmenities(estate_id, amenities) {
    amenities = (amenities || []).map((amenity) => omit(amenity, ['id']))
    const trx = await Database.beginTransaction()
    try {
      await this.removeAmenitiesByLocation({ location: ['build', 'apt', 'out'], estate_id }, trx)
      if (amenities?.length) {
        await Amenity.createMany(amenities, trx)
      }

      await trx.commit()
    } catch (e) {
      console.log('handleMultipleAmenities error=', e.message)
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400, e.code || 0)
    }
  }

  static async removeAmenitiesByLocation({ location, estate_id }, trx) {
    let query = Amenity.query().delete()
    if (location) {
      location = Array.isArray(location) ? location : [location]
      query.whereIn('location', location)
    }
    query.where('estate_id', estate_id).transacting(trx)
    await query
  }

  static async getMandatoryAmenityIds() {
    const mandatoryAmenityKeys = Object.values(MANDATORY_AMENITIES)
    const amenities = await Option.query().whereIn('title', mandatoryAmenityKeys).fetch()
    return (amenities.toJSON() || []).map((amenity) => amenity.id)
  }
}

module.exports = EstateAmenityService
