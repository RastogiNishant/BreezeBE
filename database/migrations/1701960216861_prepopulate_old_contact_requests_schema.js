'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const moment = use('moment')
const { DATE_FORMAT } = use('App/constants')

class PrepopulateOldContactRequestsSchema extends Schema {
  up() {
    const yesterday = moment.utc(new Date()).add(-1, 'days').format(DATE_FORMAT)
    this.schedule(async (trx) => {
      // we let all old contact requests have one reminder sent
      // so they'll have the next reminder next week
      await Database.raw(
        `update estate_sync_contact_requests 
          set reminders_to_convert=1, last_reminder=NOW()
          where created_at<='${yesterday}'`
      )
    })
  }

  down() {}
}

module.exports = PrepopulateOldContactRequestsSchema
