'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const { URGENCY_NORMAL, TASK_STATUS_NEW, ROLE_LANDLORD, ROLE_USER } = require('../../app/constants')

class TasksSchema extends Schema {
  up() {
    this.create('tasks', (table) => {
      table.increments()
      table.integer('estate_id').unsigned().notNullable().references('id').inTable('estates')
      table.integer('tenant_id').unsigned().notNullable().references('id').inTable('users')
      table.integer('urgency').defaultTo(URGENCY_NORMAL)
      table.integer('status').defaultTo(TASK_STATUS_NEW)
      table.integer('creator_role')
      table.json('attachments')
      table.timestamp('created_at', { precision: 3 }).defaultTo(Database.fn.now(3))
      table.timestamp('updated_at', { precision: 3 }).defaultTo(Database.fn.now(3))
    })
  }

  down() {
    this.drop('tasks')
  }
}

module.exports = TasksSchema
