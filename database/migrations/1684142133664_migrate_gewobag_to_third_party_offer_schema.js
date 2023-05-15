'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')

class MigrateGewobagToThirdPartyOfferSchema extends Schema {
  async up() {
    await ThirdPartyOfferService.pullGewobag()
  }

  down() {}
}

module.exports = MigrateGewobagToThirdPartyOfferSchema
