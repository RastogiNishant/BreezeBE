'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { THIRD_PARTY_OFFER_PROVIDER_INFORMATION } = require('../../app/constants')
const ThirdPartyOffer = use('App/Models/ThirdPartyOffer')

class PopulateProviderInformationToThirdPartyOffersSchema extends Schema {
  async up() {
    await ThirdPartyOffer.query().where('source', 'ohnemakler').update({
      source_information: THIRD_PARTY_OFFER_PROVIDER_INFORMATION['ohnemakler'],
    })
  }

  down() {}
}

module.exports = PopulateProviderInformationToThirdPartyOffersSchema
