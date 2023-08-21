'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')
class AdjustUnitAmenitiesOrderSchema extends Schema {
  async up() {
    await Option.query()
      .where('title', 'apartment.amenities.Apartment.partially_furnished')
      .where('type', 'apt')
      .update({ order: 28 })

    await Option.query().where('title', 'fitted_kitchen').update({ type: 'apt', order: 13 })
    await Option.query().where('title', 'bathtub').update({ type: 'apt', order: 15 })
    await Option.query()
      .where('title', 'apartment.amenities.Apartment.Sharedbathroom')
      .where('type', 'room')
      .update({ type: 'apt', order: 22, title: 'apartment.amenities.WC_bathroom.guest_toilet' })
    await Option.query()
      .where('title', 'apartment.amenities.Apartment.Barrier-free')
      .update({ type: 'apt', order: 24 })
  }

  down() {}
}

module.exports = AdjustUnitAmenitiesOrderSchema
