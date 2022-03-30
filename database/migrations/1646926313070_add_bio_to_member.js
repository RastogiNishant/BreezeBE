'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddBioToMember extends Schema {
  up() {
    this.table('members', (table) => {
      table.string('bio')
    })
  }
}

module.exports = AddBioToMember
