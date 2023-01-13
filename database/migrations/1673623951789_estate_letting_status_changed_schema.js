'use strict'

const {
  LETTING_TYPE_LET,
  LETTING_STATUS_STANDARD,
  LETTING_TYPE_VOID,
  LETTING_STATUS_VACANT,
  LETTING_STATUS_NEW_RENOVATED,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const Database = use('Database')

/** Letting status type before **/
// LETTING_STATUS_DEFECTED: 1,
// LETTING_STATUS_TERMINATED: 2,
// LETTING_STATUS_NORMAL: 3,
// LETTING_STATUS_CONSTRUCTION_WORKS: 4,
// LETTING_STATUS_STRUCTURAL_VACANCY: 5,
// LETTING_STATUS_FIRST_TIME_USE: 6,
// LETTING_STATUS_VACANCY: 7,

class EstateLettingStatusChangedSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()
    try {
      await Estate.query()
        .where('letting_type', LETTING_TYPE_LET)
        .where('letting_status', 3)
        .update({ letting_status: LETTING_STATUS_STANDARD })
        .transacting(trx)
      await Estate.query()
        .where('letting_type', LETTING_TYPE_VOID)
        .where('letting_status', 4)
        .update({ letting_status: LETTING_STATUS_VACANT })
        .transacting(trx)
      await Estate.query()
        .where('letting_type', LETTING_TYPE_VOID)
        .where('letting_status', 5)
        .update({ letting_status: LETTING_STATUS_NEW_RENOVATED })
        .transacting(trx)
      await Estate.query()
        .where('letting_type', LETTING_TYPE_VOID)
        .where('letting_status', 6)
        .update({ letting_status: LETTING_STATUS_VACANT })
        .transacting(trx)
      await Estate.query()
        .where('letting_type', LETTING_TYPE_VOID)
        .where('letting_status', 7)
        .update({ letting_status: LETTING_STATUS_NEW_RENOVATED })
        .transacting(trx)
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log('Failed to update=', e.message)
    }
  }

  down() {}
}

module.exports = EstateLettingStatusChangedSchema
