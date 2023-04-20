'use strict'

const { PETS_SMALL } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class EstatePetsAllowedToIntSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      // alter table
      table.integer('pets_allowed').alter()
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = EstatePetsAllowedToIntSchema
