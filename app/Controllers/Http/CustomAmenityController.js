'use strict'

const {
  STATUS_DELETE,
  ROOM_CUSTOM_AMENITIES_MAX_COUNT,
  ROOM_CUSTOM_AMENITIES_EXCEED_MAX_ERROR,
} = require('../../constants')
const HttpException = use('App/Exceptions/HttpException')

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

  async getAll({ request, auth, response }) {
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
