'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class SetLocationValuesForExistingAmenitiesSchema extends Schema {
  async up() {
    await Database.raw(`update amenities set location='room' where "room_id" is not null`)
  }

  down() {
    this.table('amenities', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SetLocationValuesForExistingAmenitiesSchema
