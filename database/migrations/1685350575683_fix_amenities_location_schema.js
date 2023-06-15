'use strict'

const { ESTATE_AMENITY_LOCATIONS } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class FixAmenitiesLocationSchema extends Schema {
  async up() {
    await Database.raw(`
      update amenities set location =
        CASE 
          WHEN a1.location = 'apartment' THEN 'apt'
          WHEN a1.location = 'vicinity' THEN 'out'          
          WHEN a1.location = 'kitchen' THEN 'room'                    
          WHEN a1.location = 'building' THEN 'build'
          ELSE a1.location
        END  
      FROM
      amenities a1
      WHERE amenities.id=a1.id
    `)
  }

  down() {
    this.table('fix_amenities_locations', (table) => {
      // reverse alternations
    })
  }
}

module.exports = FixAmenitiesLocationSchema
