'use strict'

const { STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncContactRequestsSchema extends Schema {
  up() {
    this.create('estate_sync_contact_requests', (table) => {
      table.increments()
      table.string('email').notNullable().index()
      table.json('contact_info')
      table.text('message')
      table.integer('user_id').references('id').inTable('users').nullable().index()
      table.integer('estate_id').notNullable().references('id').inTable('estates').index()
      table.string('code', 60)
      table.integer('status').unsigned().defaultTo(STATUS_DRAFT).index()
      table.timestamps()

      table.unique(['email', 'estate_id'])
    })
  }

  down() {
    this.drop('estate_sync_contact_requests')
  }
}

module.exports = AddEstateSyncContactRequestsSchema
