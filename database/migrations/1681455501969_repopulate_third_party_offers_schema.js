'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')

class RepopulateThirdPartyOffersSchema extends Schema {
  async up() {
    await ThirdPartyOfferService.pullOhneMakler(true)
  }

  down() {
    this.table('third_party_offers', (table) => {
      // reverse alternations
    })
  }
}

module.exports = RepopulateThirdPartyOffersSchema
