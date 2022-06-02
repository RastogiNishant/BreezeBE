'use strict'
const Database = use('Database')
const Amenity = use('App/Models/Amenity')
const {
  STATUS_ACTIVE,
  STATUS_DELETE,
  ESTATE_CUSTOM_AMENITIES_MAX_COUNT,
  ESTATE_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH,
} = require('../../constants')
const { reverse } = require('lodash')

class EstateAmenityController {
  async get({ request, response }) {
    const { location, estate_id } = request.all()
    let amenities

    if (location) {
      amenities = await Database.select(
        Database.raw(`location, json_agg(damenities.* order by sequence_order desc) as amenities`)
      )
        .from(
          Database.raw(`(select amenities.*,
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
         and status='${STATUS_ACTIVE}'
         ) as damenities`)
        )
        .where('location', location)
        .where('estate_id', estate_id)
        .where('status', STATUS_ACTIVE)
        .groupBy('location')
    } else {
      amenities = await Database.select(
        Database.raw(`location, json_agg(damenities.* order by sequence_order desc) as amenities`)
      )
        .from(
          Database.raw(`(select amenities.*,
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
             and status='${STATUS_ACTIVE}'
             and location<>'room'
             ) as damenities`)
        )
        .where('estate_id', estate_id)
        .where('status', STATUS_ACTIVE)
        .groupBy('location')
    }

    return response.res({ amenities })
  }

  async add({ auth, request, response }) {
    let { amenity, estate_id, type, option_id, location } = request.all()
    let currentEstateAmenities = await Amenity.query()
      .where('status', STATUS_ACTIVE)
      .where('estate_id', estate_id)
      .where('location', location)
      .orderBy('sequence_order', 'desc')
      .fetch()
    let sequence_order = 1
    currentEstateAmenities = currentEstateAmenities.toJSON()
    let newEstateAmenity = new Amenity()
    let newEstateAmenityId
    const trx = await Database.beginTransaction()

    if (type === 'custom_amenity') {
      //we check if addition of custom amenities could be possible...
      let currentEstateCustomAmenities = await Amenity.query()
        .where('status', STATUS_ACTIVE)
        .where('type', 'custom_amenity')
        .where('estate_id', estate_id)
        .where('location', location)
        .orderBy('sequence_order', 'desc')
        .fetch()

      currentEstateCustomAmenities = currentEstateCustomAmenities.toJSON()
      if (currentEstateCustomAmenities.length >= ESTATE_CUSTOM_AMENITIES_MAX_COUNT) {
        throw new HttpException(
          `You can only have at most ${ESTATE_CUSTOM_AMENITIES_MAX_COUNT} custom amenities for each ${location}.`,
          422,
          ESTATE_CUSTOM_AMENITIES_EXCEED_MAX_ERROR
        )
      }

      if (currentEstateAmenities.length) {
        //we place this custom_amenity at the top
        sequence_order = parseInt(currentEstateAmenities[0].sequence_order) + 1
      }
      newEstateAmenity.amenity = amenity
      newEstateAmenity.added_by = auth.user.id
      newEstateAmenity.type = 'custom_amenity'
      newEstateAmenity.estate_id = estate_id
      newEstateAmenity.status = STATUS_ACTIVE
      newEstateAmenity.sequence_order = sequence_order
      newEstateAmenity.location = location
      await newEstateAmenity.save()
      newEstateAmenityId = newEstateAmenity.id
    } else if (type === 'amenity') {
      let sequence_order = 0
      await Promise.all(
        currentEstateAmenities.map(async (currentEstateAmenity) => {
          sequence_order = currentEstateAmenity.sequence_order + 1
          await Amenity.query().where('id', currentEstateAmenity.id).update({ sequence_order })
        })
      )
      newEstateAmenity.fill({
        added_by: auth.user.id,
        sequence_order: 1, //we place an amenity type at the bottom of the list.
        type: 'amenity',
        estate_id,
        option_id,
        status: STATUS_ACTIVE,
        location,
      })
      await newEstateAmenity.save()
      newEstateAmenityId = newEstateAmenity.id
    }
    //we return all amenities like getAll...
    const amenities = await Database.select(
      Database.raw(`location, json_agg(damenities.* order by sequence_order desc) as amenities`)
    )
      .from(
        Database.raw(`(select amenities.*,
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
           and status='${STATUS_ACTIVE}'
           and location<>'room'
           ) as damenities`)
      )
      .where('estate_id', estate_id)
      .where('status', STATUS_ACTIVE)
      .groupBy('location')
    return response.res({
      newEstateAmenityId,
      total: amenities.length,
      amenities: amenities,
    })
  }

  async delete({ request, response }) {
    const { estate_id, id, location } = request.all()
    const affectedRows = await Amenity.query()
      .where('estate_id', estate_id)
      .where('location', location)
      .where('id', id)
      .update({ status: STATUS_DELETE })
    return response.res({ deleted: affectedRows })
  }

  async update({ request, response }) {
    const { action, amenity, amenity_ids, id, estate_id, location } = request.all()
    let affectedRows = 0
    switch (action) {
      case 'update':
        //we can only update a custom_amenity. If you want to update an amenity. Just delete.
        affectedRows = await Amenity.query()
          .where('id', id)
          .where('type', 'custom_amenity')
          .where('location', location)
          .where('estate_id', estate_id)
          .where('status', STATUS_ACTIVE)
          .update({ amenity })
        break
      case 'reorder':
        const currentAmenities = await Amenity.query()
          .whereIn('id', amenity_ids)
          .where('location', location)
          .where('estate_id', estate_id)
          .where('status', STATUS_ACTIVE)
          .fetch()
        if (currentAmenities.rows.length !== amenity_ids.length) {
          throw new HttpException(
            'Error found while validating amenity ids',
            422,
            ESTATE_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH
          )
        }
        Promise.all(
          await reverse(amenity_ids).map(async (id, index) => {
            await Amenity.query()
              .where('id', id)
              .update({ sequence_order: index + 1 })
          })
        )
        affectedRows = 1
        break
    }
    response.res(affectedRows > 0)
  }
}

module.exports = EstateAmenityController
