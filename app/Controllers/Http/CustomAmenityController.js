'use strict'
const CustomAmenity = use('App/Models/CustomAmenity')

class CustomAmenityController {
  static async addCustomAmenity({ request, auth, response }) {
    response.res(true)
  }

  static async getAll({ request, auth, response }) {
    const { room_id } = request.all()
    const amenities = await CustomAmenity.query().where('room_id', room_id).fetch()
    response.res(amenities)
  }
}

module.exports = CustomAmenityController
