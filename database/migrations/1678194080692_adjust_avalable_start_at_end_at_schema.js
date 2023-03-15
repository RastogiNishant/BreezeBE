'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Estate = use('App/Models/Estate')
const moment = use('moment')

class AdjustAvalableStartAtEndAtSchema extends Schema {
  async up() {
    const estates = (
      await Estate.query()
        .select('id', 'avail_duration', 'available_date')
        .whereNotNull('available_date')
        .fetch()
    ).toJSON()

    let i = 0
    while (i < estates.length) {
      const estate = estates[i]
      await Estate.query()
        .where('id', estate.id)
        .update({
          available_start_at: moment(estate.available_date).subtract(estate.avail_duration, 'days'),
          available_end_at: estate.available_date,
        })
      i++
    }
  }

  down() {}
}

module.exports = AdjustAvalableStartAtEndAtSchema
