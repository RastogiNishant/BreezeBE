'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const ThirdPartyOfferService = use('App/Services/ThirdPartyOfferService')

class PopulatePropertyHouseBuildingTypesSchema extends Schema {
  async up() {
    await ThirdPartyOfferService.pullOhneMakler(true)
  }

  down() {}
}

module.exports = PopulatePropertyHouseBuildingTypesSchema
