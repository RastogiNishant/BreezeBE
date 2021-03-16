'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserSchema extends Schema {
  up() {
    this.create('users', (table) => {
      table.increments()
      table.string('username', 80).notNullable().unique()
      table.string('password', 60).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone', 30)
      table.date('birthday')
      table.enu('sex', ['male', 'female'])
      table.string('region')
      table.decimal('balance').defaultTo(0)
      table.boolean('deleted').defaultTo(false)
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
