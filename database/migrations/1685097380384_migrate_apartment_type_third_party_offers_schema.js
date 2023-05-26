'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class MigrateApartmentTypeThirdPartyOffersSchema extends Schema {
  async up() {
    await Database.raw(`
      update third_party_offers tpo set apt_type=12 where tpo.apt_type=14
    `)
  }

  down() {}
}

module.exports = MigrateApartmentTypeThirdPartyOffersSchema
