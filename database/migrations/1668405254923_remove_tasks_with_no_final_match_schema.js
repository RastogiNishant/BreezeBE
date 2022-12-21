'use strict'

const {
  TASK_STATUS_DELETE,
  MATCH_STATUS_FINISH,
  TASK_STATUS_ARCHIVED,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Task = use('App/Models/Task')
const Match = use('App/Models/Match')

class RemoveTasksWithNoFinalMatchSchema extends Schema {
  async up() {
    const tasks = await Task.query()
      .whereNotIn('tasks.status', [TASK_STATUS_DELETE, TASK_STATUS_ARCHIVED])
      .fetch()

    await Promise.all(
      (tasks.rows || []).map(async (task) => {
        const match = await Match.query()
          .where('estate_id', task.estate_id)
          .where('user_id', task.tenant_id)
          .where('status', MATCH_STATUS_FINISH)
          .first()
        if (!match) {
          await Task.query().where('id', task.id).update({ status: TASK_STATUS_ARCHIVED })
        }
      })
    )
  }

  down() {}
}

module.exports = RemoveTasksWithNoFinalMatchSchema
