'use strict'

const { STATUS_ACTIVE } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
class AddGalleriesSchema extends Schema {
  up() {
    this.create('galleries', (table) => {
      table.increments()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('cascade')
      table.string('url', 254).notNullable()
      table.string('original_file_name', 254).notNullable()
      table.string('disk', 10).defaultTo('s3public').notNullable()
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.timestamp('created_at').defaultTo(Database.fn.now())
      table.timestamp('updated_at').defaultTo(Database.fn.now())

      table.index('user_id')
    })
  }

  down() {
    this.drop('galleries')
  }
}

module.exports = AddGalleriesSchema
