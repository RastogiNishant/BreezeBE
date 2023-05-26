'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const {
  APARTMENT_TYPE_ATTIC,
  APARTMENT_TYPE_FLAT,
  APARTMENT_TYPE_GALLERY,
  APARTMENT_TYPE_HOLIDAY,
} = require('../../app/constants')

class MigrateApartmentTypeThirdPartyOffersSchema extends Schema {
  async up() {
    //14 used to be APARTMENT_TYPE_ATTIC
    //13 used to be APARTMENT_TYPE_RAW_ATTIC
    //12 used to be APARTMENT_TYPE_GALLERY
    //11 used to be APARTMENT_TYPE_HOLIDAY
    //10 used to be APARTMENT_TYPE_ETAGE
    await Database.raw(`
      update third_party_offers tpo set apt_type=
        CASE 
          WHEN tpo1.apt_type = 14 THEN ${APARTMENT_TYPE_ATTIC}
          WHEN tpo1.apt_type = 13 THEN ${APARTMENT_TYPE_ATTIC}
          WHEN tpo1.apt_type = 12 THEN ${APARTMENT_TYPE_GALLERY}
          WHEN tpo1.apt_type = 11 THEN ${APARTMENT_TYPE_HOLIDAY}
          WHEN tpo1.apt_type = 10 THEN ${APARTMENT_TYPE_FLAT}
          ELSE tpo1.apt_type
        END  
      FROM
        third_party_offers tpo1
      WHERE tpo1.id=tpo.id
    `)
  }

  down() {}
}

module.exports = MigrateApartmentTypeThirdPartyOffersSchema
