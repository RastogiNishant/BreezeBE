'use strict'

const {
  LETTING_TYPE_LET,
  LETTING_STATUS_STANDARD,
  LETTING_TYPE_VOID,
  LETTING_STATUS_VACANCY,
  LETTING_TYPE_NA,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')

class AdjustLettingStatusSchema extends Schema {
  async up() {
    const estates = (await Estate.query().whereNull('letting_status').fetch()).toJSON() || []

    let i = 0
    while (i < estates.length) {
      let letting_status
      const estate = estates[i]
      if (estate.letting_type === LETTING_TYPE_LET) {
        letting_status = LETTING_STATUS_STANDARD
      } else if (estate.letting_type === LETTING_TYPE_VOID) {
        letting_status = LETTING_STATUS_VACANCY
      }

      await Estate.query().where('id', estate.id).update({ letting_status })

      i++
    }
    await Estate.query().whereNull('letting_type').update({ letting_type: LETTING_TYPE_NA })
  }

  down() {}
}

module.exports = AdjustLettingStatusSchema
