'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const moment = use('moment')
const { DATE_FORMAT } = use('App/constants')

class PrepopulateOldContactRequestsSchema extends Schema {
  up() {
    const yesterday = moment.utc(new Date()).add(-1, 'days').format(DATE_FORMAT)
    const lastWeek = moment.utc(new Date()).add(-7, 'days').format(DATE_FORMAT)
    this.schedule(async (trx) => {
      // we let all old contact requests have one reminder sent
      // so they'll have the next reminder on the following week
      await Database.raw(
        `update estate_sync_contact_requests 
          set reminders_to_convert=1, last_reminder_at=NOW()
          where created_at<='${yesterday}'
          and user_id is null
        `
      )
      // we let all older than last week contacts have 2 reminders sent
      await Database.raw(
        `update estate_sync_contact_requests
          set reminders_to_convert=2, last_reminder_at='${lastWeek}'
          where created_at<='${lastWeek}'
        `
      )
    })
  }

  down() {}
}

module.exports = PrepopulateOldContactRequestsSchema
