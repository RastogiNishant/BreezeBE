'use strict'

const Database = use('Database')
const { STATUS_ACTIVE } = require('../constants')
const Promise = require('bluebird')
const { omit } = require('lodash')
const Amenity = use('App/Models/Amenity')
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
      status: STATUS_ACTIVE,
    }

    const amenityEntity = await this.getAmenity({
      estate_id: amenity.estate_id,
      option_id: amenity.option_id,
      type: amenity.type,
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

  static async handleMultipleAmenities(amenities) {
    const trx = await Database.beginTransaction()
    try {
      await Promise.map(
        amenities,
        async (amenity) => {
          await this.handleSingleAmenity(amenity, trx)
        },
        { concurrency: 1 }
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }
}

module.exports = EstateAmenityService
