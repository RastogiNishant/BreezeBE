'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { APARTMENT_TYPE_ATTIC } = require('../../app/constants')

class MigrateApartmentTypeThirdPartyOffersSchema extends Schema {
  async up() {
    await Database.raw(`
      update third_party_offers tpo set apt_type=${APARTMENT_TYPE_ATTIC} where tpo.apt_type=14
    `)
  }

  down() {}
}

module.exports = MigrateApartmentTypeThirdPartyOffersSchema
