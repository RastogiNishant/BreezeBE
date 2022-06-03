'use strict'
const moment = require('moment')
const {
  MATCH_STATUS_INVITE,
  MATCH_STATUS_KNOCK,
  DATE_FORMAT,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Database = use('Database')
const Schema = use('Schema')

class UpdateShowDateEndedEstatesInvites extends Schema {
  async up() {
    const start = moment()
    // Because estate's timeslots(show date) is over and the prospects are not able to pick timeslot anymore
    const estates = (
      await Database.raw(
        `
          SELECT estates.* FROM estates
          INNER JOIN time_slots on time_slots.estate_id = estates.id
          WHERE end_at IN (SELECT max(end_at) FROM time_slots WHERE estate_id = estates.id)
          AND estates.status IN (${STATUS_ACTIVE},${STATUS_EXPIRE})
          AND end_at <= '${start.format(DATE_FORMAT)}'
          ORDER BY estates.id
        `
      )
    ).rows

    await Database.table('matches')
      .where('status', MATCH_STATUS_INVITE)
      .whereIn(
        'estate_id',
        estates.map((e) => e.id)
      )
      .update({ status: MATCH_STATUS_KNOCK })
  }

  down() {}
}

module.exports = UpdateShowDateEndedEstatesInvites
