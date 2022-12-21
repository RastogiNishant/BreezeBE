'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

class AdjustEstateWrongPostcodeSchema extends Schema {
  async up() {
    const estates =
      (
        await Estate.query()
          .select('id', 'address', 'zip')
          .where(Database.raw(`LENGTH(zip) = 4 `))
          .fetch()
      ).rows || []

    await Promise.all(
      estates.map(async (estate) => {
        const addressList = estate.address.split(estate.zip)
        const address = addressList[0] + `0${estate.zip}` + addressList[1] || ''
        await Estate.query()
          .where('id', estate.id)
          .update({ zip: `0${estate.zip}`, address })
      })
    )
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustEstateWrongPostcodeSchema
