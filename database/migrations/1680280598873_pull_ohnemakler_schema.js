'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')
class PullOhnemaklerSchema extends Schema {
  async up() {
    await ThirdPartyOfferService.pullOhneMakler(true)
  }

  down() {}
}

module.exports = PullOhnemaklerSchema
