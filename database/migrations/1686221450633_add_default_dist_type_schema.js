'use strict'

const {
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
} = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDefaultDistTypeSchema extends Schema {
  async up() {
    this.alter('tenants', (table) => {
      // alter table
      table
        .enum('dist_type', [TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL])
        .defaultTo(TRANSPORT_TYPE_CAR)
        .alter()
      table.integer('dist_min').unsigned().defaultTo(60).alter() // 0(max), 15, 30, 45, 60
    })
  }

  down() {
    this.table('tenants', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddDefaultDistTypeSchema
