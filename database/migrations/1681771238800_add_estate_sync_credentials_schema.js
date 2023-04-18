'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddEstateSyncCredentialsSchema extends Schema {
  up() {
    this.create('estate_publisher_credentials', (table) => {
      table.increments()
      table.string('type').comment('see ESTATE_PUBLISHER_...')
      table.integer('user_id').references('id').inTable('users').nullable()
      table.string('source_type').comment('see ESTATE_PUBLISHER_SOURCE_...')
      table.boolean('use_estate_sync').defaultTo(true).comment('whether to use estate_sync or not.')
      table.timestamps()

      table.unique(['user_id', 'type'])
    })
  }

  down() {
    this.drop('estate_publisher_credentials')
  }
}

module.exports = AddEstateSyncCredentialsSchema
