'use strict'

const {
  STATUS_DELETE,
  ROOM_CUSTOM_AMENITIES_MAX_COUNT,
  ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR,
  ROOM_CUSTOM_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH,
  STATUS_ACTIVE,
} = require('../../constants')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { reverse } = require('lodash')
const Promise = require('bluebird')

const RoomAmenity = use('App/Models/RoomAmenity')

class RoomAmenityController {
  async add({ request, auth, response }) {
    let { amenity, room_id, type, option_id } = request.all()

    let currentRoomAmenities = await RoomAmenity.query()
      .whereNotIn('status', [STATUS_DELETE])
      .where('room_id', room_id)
      .orderBy('sequence_order', 'desc')
      .fetch()
    currentRoomAmenities = currentRoomAmenities.toJSON()
    let newRoomAmenity = new RoomAmenity()
    let newRoomAmenityId

    if (type === 'custom_amenity') {
      let currentRoomCustomAmenities = await RoomAmenity.query()
        .whereNotIn('status', [STATUS_DELETE])
        .where('type', 'custom_amenity')
        .where('room_id', room_id)
        .orderBy('sequence_order', 'desc')
        .fetch()
      currentRoomCustomAmenities = currentRoomCustomAmenities.toJSON()
      if (currentRoomCustomAmenities.length >= ROOM_CUSTOM_AMENITIES_MAX_COUNT) {
        throw new HttpException(
          `You can only have at most ${ROOM_CUSTOM_AMENITIES_MAX_COUNT} custom amenities for each room.`,
          422,
          ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR
        )
      }
      newRoomAmenity.amenity = amenity
      newRoomAmenity.added_by = auth.user.id
      newRoomAmenity.type = 'custom_amenity'
      newRoomAmenity.room_id = room_id
      newRoomAmenity.status = STATUS_ACTIVE
      newRoomAmenity.sequence_order = parseInt(currentRoomAmenities[0].sequence_order) + 1
      await newRoomAmenity.save()
      newRoomAmenityId = newRoomAmenity.id
    } else if (type === 'amenity') {
      let sequence_order = 0
      await Promise.all(
        currentRoomAmenities.map(async (currentRoomAmenity) => {
          sequence_order = currentRoomAmenity.sequence_order + 1
          await RoomAmenity.query().where('id', currentRoomAmenity.id).update({ sequence_order })
        })
      )
      newRoomAmenity.fill({
        added_by: auth.user.id,
        sequence_order: 1,
        type: 'amenity',
        room_id: room_id,
        option_id,
        status: STATUS_ACTIVE,
      })
      await newRoomAmenity.save()
      newRoomAmenityId = newRoomAmenity.id
    }
    //we return all amenities like getAll...
    const amenities = await RoomAmenity.query()
      .select(
        Database.raw(
          `room_amenities.*,
          case
            when
              room_amenities.type='amenity'
            then
              "options"."title"
            else
              "room_amenities"."amenity"
          end as amenity`
        )
      )
      .leftJoin('options', function () {
        this.on('options.id', 'option_id')
      })
      .where('room_id', room_id)
      .whereNotIn('status', [STATUS_DELETE])
      .orderBy('sequence_order', 'desc')
      .fetch()

    response.res({
      newRoomAmenityId,
      total: amenities.rows.length,
      amenities: amenities,
    })
  }

  async delete({ request, response }) {
    const { id, room_id } = request.all()
    const affectedRows = await CustomAmenity.query()
      .where('id', id)
      .where('room_id', room_id)
      .update({ status: STATUS_DELETE })
    response.res({ deleted: affectedRows })
  }

  async update({ request, response }) {
    const { action, id, amenity, amenity_ids, room_id } = request.all()
    let affectedRows = 0
    switch (action) {
      case 'update':
        affectedRows = await CustomAmenity.query().where('id', id).update({ amenity })
        break
      case 'reorder':
        const currentCustomAmenities = await CustomAmenity.query()
          .whereIn('id', amenity_ids)
          .where('room_id', room_id)
          .whereNotIN('status', [STATUS_DELETE])
          .fetch()
        if (currentCustomAmenities.rows.length !== amenity_ids.length) {
          throw new HttpException(
            'Error found while validating amenity ids',
            422,
            ROOM_CUSTOM_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH
          )
        }
        Promise.all(
          await reverse(amenity_ids).map(async (id, index) => {
            await CustomAmenity.query()
              .where('id', id)
              .update({ sequence_order: index + 1 })
          })
        )
        affectedRows = 1
        break
    }
    response.res(affectedRows > 0)
  }

  async getAll({ request, response }) {
    const { room_id } = request.all()
    const amenities = await RoomAmenity.query()
      .select(
        Database.raw(
          `room_amenities.*,
          case
            when
              room_amenities.type='amenity'
            then
              "options"."title"
            else
              "room_amenities"."amenity"
          end as amenity`
        )
      )
      .leftJoin('options', function () {
        this.on('options.id', 'option_id')
      })
      .where('room_id', room_id)
      .whereNotIn('status', [STATUS_DELETE])
      .orderBy('sequence_order', 'desc')
      .fetch()
    response.res({
      total: amenities.rows.length,
      amenities: amenities,
    })
  }
}

module.exports = RoomAmenityController
