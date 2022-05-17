'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Visit = require('../../app/Models/Visit')
const moment = require('moment')

const { MINIMUM_SHOW_PERIOD,DATE_FORMAT } = require('../../app/constants')

class AdjustStartEndDateForExistVisitSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()

    const visits = await Database.table('visits')
      .select(['visits.*', '_s.slot_length as slot_length'])
      .whereNull('start_date')
      .leftJoin({ _s: 'time_slots' }, function () {
        this.on('visits.estate_id', '_s.estate_id')
      })

    try {
      await Promise.all(
        visits.map(async (visit) => {
          await Visit.query()
            .where('estate_id', visit.estate_id)
            .where('user_id', visit.user_id)
            .update({
              start_date: visit.date,
              end_date: visit.slot_length
                ? moment(visit.date).add(visit.slot_length, 'minutes').format(DATE_FORMAT)
                : moment(visit.date).add(MINIMUM_SHOW_PERIOD, 'minutes').format(DATE_FORMAT),
            })
            .transacting(trx)
        })
      )
      await trx.commit()
      console.log("updated all tenants' income")
    } catch (e) {
      await trx.rollback()
      console.log(e.message)
    }
  }

  down() {
    this.table('adjust_start_end_date_for_exist_visits', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AdjustStartEndDateForExistVisitSchema
