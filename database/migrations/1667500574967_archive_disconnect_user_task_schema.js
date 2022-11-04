'use strict'

const { TASK_STATUS_UNRESOLVED, STATUS_DELETE, TASK_STATUS_DELETE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Task = use('App/Models/Task')

class ArchiveDisconnectUserTaskSchema extends Schema {
  async up() {
    const tasks = (await Task.query().whereNotIn('status', [TASK_STATUS_DELETE]).fetch()).rows || []
    tasks.map(async (task) => {
      const ect = await EstateCurrentTenant.query()
        .where('estate_id', task.estate_id)
        .where('user_id', task.tenant_id)
        .first()
      if (!ect) {
        await Task.query().where('id', task.id).update({ status: TASK_STATUS_UNRESOLVED })
      }
    })
  }

  down() {}
}

module.exports = ArchiveDisconnectUserTaskSchema
