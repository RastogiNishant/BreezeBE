'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

class SetDefaultForLettingStatusSchema extends Schema {
  up() {
    this.schedule(async (trx) => {
      await Database.raw(
        'update estates set letting_status=3, letting_type=1 ' +
          'from (select letting_status, letting_type, id from estates) as e ' +
          'where e.id=estates.id AND e.letting_status is null AND e.letting_type is null'
      )
    })
  }

  down() {
    this.table('estates', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SetDefaultForLettingStatusSchema
