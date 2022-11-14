'use strict'

const { TASK_STATUS_DELETE, MATCH_STATUS_FINISH } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Task = use('App/Models/Task')
const Match = use('App/Models/Match')

class RemoveTasksWithNoFinalMatchSchema extends Schema {
  async up() {
    const tasks = await Task.query()
      .whereNot('tasks.status', TASK_STATUS_DELETE)
      .leftJoin({ _m: 'matches' }, function () {
        this.on('tasks.estate_id', '_m.estate_id')
          .on('tasks.tenant_id', '_m.user_id')
          .onIn('_m.status', [MATCH_STATUS_FINISH])
      })
      .fetch()

    await Promise.all(
      (tasks.rows || []).map(async (task) => {
        const match = await Match.query()
          .where('estate_id', task.estate_id)
          .where('user_id', task.tenant_id)
          .where('status', MATCH_STATUS_FINISH)
          .first()
        if (!match) {
          await Task.query().where('id', task.id).update({ status: TASK_STATUS_DELETE })
        }
      })
    )
  }

  down() {}
}

module.exports = RemoveTasksWithNoFinalMatchSchema
