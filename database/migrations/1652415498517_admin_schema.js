'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AdminSchema extends Schema {
  up() {
    this.create('admins', (table) => {
      table.increments()
      table.string('uid', 32)
      table.string('email', 255).unique()
      table.string('password', 60)
      table.string('fullname', 255).nullable()
      table.timestamps()
    })
  }

  down() {
    this.drop('admins')
  }
}

module.exports = AdminSchema
