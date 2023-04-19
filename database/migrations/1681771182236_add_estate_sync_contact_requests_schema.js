'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncContactRequestsSchema extends Schema {
  up() {
    this.create('estate_sync_contact_requests', (table) => {
      table.increments()
      table.string('email').unique()
      table.json('user_info')
      table.text('message')
      table.integer('user_id').references('id').inTable('users').nullable().index()
      table.integer('estate_id').references('id').inTable('estates').index()
      table.timestamps()

      table.unique(['email', 'estate_id'])
    })
  }

  down() {
    this.drop('estate_sync_contact_requests')
  }
}

module.exports = AddEstateSyncContactRequestsSchema
