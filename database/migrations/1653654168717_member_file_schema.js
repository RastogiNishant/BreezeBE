'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { STATUS_ACTIVE } = require('../../app/constants')

class MemberFileSchema extends Schema {
  up() {
    this.create('member_files', (table) => {
      table.increments()
      table.integer('member_id').unsigned().references('id').inTable('members')
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.string('file', 255)
      table.string('type', 32)
      table.timestamps()
    })
  }

  down() {
    this.drop('member_files')
  }
}

module.exports = MemberFileSchema
