'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncCredentialsSchema extends Schema {
  up() {
    this.create('estate_sync_credentials', (table) => {
      table.increments()
      table.integer('user_id').references('id').inTable('users').nullable()
      table.string('api_key')
      table.string('type').comment('either user or breeze')
      table.string('estate_sync_contact_id')
      table.timestamps()

      table.unique(['user_id'])
    })
  }

  down() {
    this.drop('estate_sync_credentials')
  }
}

module.exports = AddEstateSyncCredentialsSchema
