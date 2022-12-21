'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

class AdjustEstateZipNaNSchema extends Schema {
  async up() {
    const estates =
      (await Estate.query().select('id', 'address', 'zip').where('zip', 'NaN').fetch()).rows || []

    await Promise.all(
      estates.map(async (estate) => {
        const addressList = estate.address.split(' nan')
        const address = addressList[0] + `` + addressList[1] || ''
        await Estate.query().where('id', estate.id).update({ zip: '', address })
      })
    )
  }

  down() {
    this.table('adjust_estate_zip_na_ns', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustEstateZipNaNSchema
