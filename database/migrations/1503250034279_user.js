'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const { STATUS_ACTIVE, GENDER_MALE } = require('../../app/constants')

class UserSchema extends Schema {
  up() {
    this.create('users', (table) => {
      table.increments()
      table.string('username', 254).notNullable()
      table.string('password', 60).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone', 30)
      table.date('birthday', { useTz: false })
      table.integer('sex').defaultTo(GENDER_MALE)
      table.integer('status').defaultTo(STATUS_ACTIVE)
      table.string('device_token', 254)
      table.timestamps()
    })
  }

  down() {
    console.log(__filename)
    this.drop('users')
  }
}

module.exports = UserSchema
