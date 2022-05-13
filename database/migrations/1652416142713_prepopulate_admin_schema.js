'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PrepopulateAdminSchema extends Schema {
  up () {
    this.table('prepopulate_admins', (table) => {
      // alter table
    })
  }

  down () {
    this.table('prepopulate_admins', (table) => {
      // reverse alternations
    })
  }
}

module.exports = PrepopulateAdminSchema
