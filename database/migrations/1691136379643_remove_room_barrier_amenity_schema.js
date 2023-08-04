'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')
class RemoveRoomBarrierAmenitySchema extends Schema {
  async up() {
    await Option.query()
      .where('type', 'room')
      .where('title', 'apartment.amenities.Apartment.Toaster')
      .delete()
    await Option.query()
      .where('type', 'room')
      .where('title', 'apartment.amenities.Apartment.Barrier-free')
      .delete()
  }

  down() {}
}

module.exports = RemoveRoomBarrierAmenitySchema
