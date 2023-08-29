'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPlaceOfBirthToMembersSchema extends Schema {
  up() {
    this.table('members', (table) => {
      // alter table
      table.string('birth_place', 255)
    })
  }

  down() {
    this.table('members', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AddPlaceOfBirthToMembersSchema
