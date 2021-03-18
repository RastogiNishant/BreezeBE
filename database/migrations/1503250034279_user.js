'use strict'

const Schema = use('Schema')
const { STATUS_ACTIVE, GENDER_MALE } = require('../../app/constants')

class UserSchema extends Schema {
  up() {
    this.create('users', (table) => {
      table.increments()
      table.string('uid', 32).notNullable().unique()
      table.string('email', 254).notNullable()
      table.string('firstname', 254)
      table.string('secondname', 254)
      table.string('password', 60).notNullable()
      table.string('phone', 30)
      table.date('birthday', { useTz: false })
      table.integer('sex').unsigned().defaultTo(GENDER_MALE)
      table.integer('status').unsigned().defaultTo(STATUS_ACTIVE)
      table.string('device_token', 254)
      table.string('avatar', 512)
      table.specificType('coord', 'geometry(point, 4326)')
      table.string('lang', 2)
      table.integer('role').unsigned().notNullable()
      table.timestamps()

      table.unique(['email', 'role'])
    })
  }

  down() {
    console.log(__filename)
    this.drop('users')
  }
}

module.exports = UserSchema
