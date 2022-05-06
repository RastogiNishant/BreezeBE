'use strict'

const {
  STATUS_DELETE,
  ROOM_CUSTOM_AMENITIES_MAX_COUNT,
  ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR,
  ROOM_CUSTOM_AMENITIES_UPDATE_REORDER_COUNT_NOT_MATCH,
} = require('../../constants')
const HttpException = use('App/Exceptions/HttpException')
const { reverse } = require('lodash')

const CustomAmenity = use('App/Models/CustomAmenity')

class CustomAmenityController {
  async add({ request, auth, response }) {
    let { amenity, room_id } = request.all()
    let currentCustomAmenities = await CustomAmenity.query()
      .whereNotIn('status', [STATUS_DELETE])
      .where('room_id', room_id)
      .orderBy('sequence_order', 'desc')
      .fetch()
    currentCustomAmenities = currentCustomAmenities.toJSON()
    if (currentCustomAmenities.length >= 3) {
      throw new HttpException(
        `You can only have at most ${ROOM_CUSTOM_AMENITIES_MAX_COUNT} custom amenities for each room.`,
        422,
        ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR
      )
    }

    let customAmenity = new CustomAmenity()
    customAmenity.room_id = room_id
    customAmenity.amenity = amenity
    customAmenity.sequence_order =
      currentCustomAmenities.length === 0
        ? 1
        : parseInt(currentCustomAmenities[0].sequence_order) + 1
    customAmenity.added_by = auth.user.id
    const result = await customAmenity.save()
    response.res(result)
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
    const amenities = await CustomAmenity.query()
      .where('room_id', room_id)
      .whereNotIn('status', [STATUS_DELETE])
      .orderBy('sequence_order', 'desc')
      .limit(ROOM_CUSTOM_AMENITIES_MAX_COUNT)
      .fetch()
    response.res({
      total: amenities.rows.length,
      limit: ROOM_CUSTOM_AMENITIES_MAX_COUNT,
      custom_amenities: amenities,
    })
  }
}

module.exports = CustomAmenityController
