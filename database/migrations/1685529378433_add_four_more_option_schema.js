'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Promise = require('bluebird')
const Schema = use('Schema')
const Option = use('App/Models/Option')
const amenitiesToAdd = [
  'apartment.amenities.Apartment.Bed_linen',
  'apartment.amenities.Apartment.Built-in_safe',
  'apartment.amenities.Apartment.Cleaning',
  'apartment.amenities.Apartment.Dining_table',
]

class AddFourMoreOptionSchema extends Schema {
  async up() {
    await Promise.map(['apt', 'room'], async (type) => {
      const lastUnitTypeOption = await Option.query()
        .where('type', type)
        .orderBy('order', 'desc')
        .first()
      let lastOrderNumber = lastUnitTypeOption.order
      const optionsToBeAdded = amenitiesToAdd.reduce((optionsToBeAdded, amenity, index) => {
        return [
          ...optionsToBeAdded,
          { title: amenity, type: type, order: lastOrderNumber + index * 10 },
        ]
      }, [])
      await Option.createMany(optionsToBeAdded)
    })
  }

  down() {}
}

module.exports = AddFourMoreOptionSchema
