'use strict'

const {
  MATCH_STATUS_TOP,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_FINISH,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Match = use('App/Models/Match')
const TaskService = use('App/Services/TaskService')
const Promise = require('bluebird')
const Database = use('Database')

class AddSystemTaskIfTopMatchSchema extends Schema {
  async up() {
    const tops = (
      await Match.query()
        .select('_e.user_id as landlord_id')
        .select('matches.*')
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.id', 'matches.estate_id')
        })
        .whereIn('matches.status', [MATCH_STATUS_TOP, MATCH_STATUS_COMMIT, MATCH_STATUS_FINISH])
        .fetch()
    ).rows

    const trx = await Database.beginTransaction()
    try {
      await Promise.map(
        tops || [],
        async (top) => {
          await TaskService.createGlobalTask(
            {
              tenantId: top.user_id,
              estateId: top.estate_id,
              landlordId: top.landlord_id,
            },
            trx
          )
        },
        { concurrency: 1 }
      )
      await trx.commit()
    } catch (e) {
      await trx.rollback()
      console.log('Migration creating system task for top is failed', e.message)
    }
  }

  down() {}
}

module.exports = AddSystemTaskIfTopMatchSchema
