'use strict'

const { MATCH_STATUS_KNOCK, MATCH_STATUS_TOP } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Promise = require('bluebird')

class ShowNotNeededKnockToTopSchema extends Schema {
  async up() {
    const knocks = await Database.raw(
      `select m.estate_id, m.user_id, m.status  from matches m inner join estates e on m.estate_id = e.id and e.is_not_show = true 
          where m.status = ${MATCH_STATUS_KNOCK} `
    )

    await Promise.map(
      knocks?.rows || [],
      async (knock) => {
        await Database.raw(
          `UPDATE matches set status = ${MATCH_STATUS_TOP} WHERE estate_id = ${knock.estate_id} and user_id = ${knock.user_id}`
        )
      },
      { concurrency: 1 }
    )
  }

  down() {}
}

module.exports = ShowNotNeededKnockToTopSchema
