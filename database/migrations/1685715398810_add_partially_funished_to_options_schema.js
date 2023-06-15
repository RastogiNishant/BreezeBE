'use strict'

const { OPTIONS_TYPE_APT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')
class AddPartiallyFunishedToOptionsSchema extends Schema {
  async up() {
    const furnished = await Option.query()
      .where('title', 'furnished')
      .where('type', OPTIONS_TYPE_APT)
      .first()
    if (furnished) {
      await Option.createItem({
        title: 'apartment.amenities.Apartment.partially_furnished',
        type: OPTIONS_TYPE_APT,
        order: furnished.order + 1,
      })
    } else {
      const lastUnitTypeOption = await Option.query()
        .where('type', OPTIONS_TYPE_APT)
        .orderBy('order', 'desc')
        .first()
      if (lastUnitTypeOption) {
        await Option.createItem({
          title: 'apartment.amenities.Apartment.partially_furnished',
          type: OPTIONS_TYPE_APT,
          order: lastUnitTypeOption.order + 10,
        })
      } else {
        await Option.createItem({
          title: 'apartment.amenities.Apartment.partially_furnished',
          type: OPTIONS_TYPE_APT,
          order: 10,
        })
      }
    }
  }

  down() {
    this.table('add_partially_funished_to_options', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddPartiallyFunishedToOptionsSchema
