'use strict'

const {
  STATUS_DELETE,
  ROOM_CUSTOM_AMENITIES_MAX_COUNT,
  ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR,
  ROOM_CUSTOM_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH,
  STATUS_ACTIVE
} = require('../../constants')
const HttpException = use('App/Exceptions/HttpException')
const Database = use('Database')
const { reverse } = require('lodash')
const Promise = require('bluebird')

const RoomAmenity = use('App/Models/Amenity')

class RoomAmenityController {
  async add({ request, auth, response }) {
    const { amenity, room_id, type, option_id } = request.all()

    let currentRoomAmenities = await RoomAmenity.query()
      .where('status', STATUS_ACTIVE)
      .where('room_id', room_id)
      .where('location', 'room')
      .orderBy('sequence_order', 'desc')
      .fetch()
    let sequence_order = 1
    currentRoomAmenities = currentRoomAmenities.toJSON()
    const newRoomAmenity = new RoomAmenity()
    let newRoomAmenityId

    if (type === 'custom_amenity') {
      // we check if addition of custom amenities could be possible...
      let currentRoomCustomAmenities = await RoomAmenity.query()
        .whereNotIn('status', [STATUS_DELETE])
        .where('type', 'custom_amenity')
        .where('room_id', room_id)
        .where('location', 'room')
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

      if (currentRoomAmenities.length) {
        // we place this custom_amenity at the top
        sequence_order = parseInt(currentRoomAmenities[0].sequence_order) + 1
      }
      newRoomAmenity.amenity = amenity
      newRoomAmenity.added_by = auth.user.id
      newRoomAmenity.type = 'custom_amenity'
      newRoomAmenity.room_id = room_id
      newRoomAmenity.status = STATUS_ACTIVE
      newRoomAmenity.sequence_order = sequence_order
      newRoomAmenity.location = 'room'
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
        sequence_order: 1, // we place an amenity type at the bottom of the list.
        type: 'amenity',
        room_id,
        option_id,
        status: STATUS_ACTIVE,
        location: 'room'
      })
      await newRoomAmenity.save()
      newRoomAmenityId = newRoomAmenity.id
    }
    // we return all amenities like getAll...
    const amenities = await RoomAmenity.query()
      .select(
        Database.raw(
          `amenities.*,
          case
            when
              "amenities".type='amenity'
            then
              "options"."title"
            else
              "amenities"."amenity"
          end as title`
        )
      )
      .leftJoin('options', function () {
        this.on('options.id', 'option_id')
      })
      .where('room_id', room_id)
      .where('location', 'room')
      .whereNotIn('status', [STATUS_DELETE])
      .orderBy('sequence_order', 'desc')
      .fetch()

    response.res({
      newRoomAmenityId,
      total: amenities.rows.length,
      amenities
    })
  }

  async delete({ request, response }) {
    const { id, room_id } = request.all()
    const affectedRows = await RoomAmenity.query()
      .where('id', id)
      .where('room_id', room_id)
      .where('location', 'room') // this is in preparation if ever
      // we have outside room amenity and we have location: outside_room
      .update({ status: STATUS_DELETE })
    response.res({ deleted: affectedRows })
  }

  async update({ request, response }) {
    const { action, id, amenity, amenity_ids, room_id } = request.all()
    let affectedRows = 0
    switch (action) {
      case 'update':
        // we can only update a custom_amenity. If you want to update an amenity. Just delete.
        affectedRows = await RoomAmenity.query()
          .where('id', id)
          .where('type', 'custom_amenity')
          .where('location', 'room')
          .update({ amenity })
        break
      case 'reorder':
        const currentCustomAmenities = await RoomAmenity.query()
          .whereIn('id', amenity_ids)
          .where('room_id', room_id)
          .where('location', 'room')
          .whereNotIn('status', [STATUS_DELETE])
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
            await RoomAmenity.query()
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
          `amenities.*,
          case
            when
              "amenities".type='amenity'
            then
              "options"."title"
            else
              "amenities"."amenity"
          end as title`
        )
      )
      .leftJoin('options', function () {
        this.on('options.id', 'option_id')
      })
      .where('room_id', room_id)
      .where('amenities.location', 'room')
      .whereNotIn('status', [STATUS_DELETE])
      .orderBy('sequence_order', 'desc')
      .fetch()
    response.res({
      total: amenities.rows.length,
      amenities
    })
  }
}

module.exports = RoomAmenityController
