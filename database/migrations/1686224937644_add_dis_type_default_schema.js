'use strict'

const { TRANSPORT_TYPE_CAR } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class AddDisTypeDefaultSchema extends Schema {
  async up() {
    await Database.raw(
      `ALTER TABLE tenants ALTER COLUMN dist_type SET DEFAULT '${TRANSPORT_TYPE_CAR}';`
    )
  }

  down() {}
}

module.exports = AddDisTypeDefaultSchema
