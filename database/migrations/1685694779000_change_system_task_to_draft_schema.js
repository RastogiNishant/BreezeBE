'use strict'

const { TASK_SYSTEM_TYPE, TASK_STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Task = use('App/Models/Task')
class ChangeSystemTaskToDraftSchema extends Schema {
  async up() {
    await Task.query().where('type', TASK_SYSTEM_TYPE).update({ status: TASK_STATUS_DRAFT })
  }

  down() {}
}

module.exports = ChangeSystemTaskToDraftSchema
