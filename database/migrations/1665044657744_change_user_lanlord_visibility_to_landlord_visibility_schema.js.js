'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ChangeUserLanlordVisibilityToLandlordVisibilitySchema extends Schema {
  up() {
    this.alter('users', (table) => {
      table.renameColumn('lanlord_visibility', 'landlord_visibility')
    })
  }

  down() {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = ChangeUserLanlordVisibilityToLandlordVisibilitySchema
