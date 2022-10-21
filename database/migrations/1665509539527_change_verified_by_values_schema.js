'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const User = use('App/Models/User')

class ChangeVerifiedByValuesSchema extends Schema {
  async up() {
    await User.query().whereNotNull('verified_by').update({ verified_by: 1 })

    this.table('users', (table) => {
      // alter table
      table.foreign('verified_by').references('id').on('admins').onDelete('SET NULL')
    })
  }

  down() {}
}

module.exports = ChangeVerifiedByValuesSchema
