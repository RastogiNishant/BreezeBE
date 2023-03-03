'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Option = use('App/Models/Option')
const Amenity = use('App/Models/Amenity')
const Database = use('Database')

class RemoveDuplicatedItemFromOptionSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()
    try {
      await Amenity.query().where('option_id', 9).delete(trx)
      await Option.query().where('title', 'elevator_5_floors').delete(trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
    }
  }

  down() {}
}

module.exports = RemoveDuplicatedItemFromOptionSchema
