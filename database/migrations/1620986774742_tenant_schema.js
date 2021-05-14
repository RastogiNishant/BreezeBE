'use strict'

const Schema = use('Schema')
const Database = use('Database')

class TenantSchema extends Schema {
  up() {
    this.alter('tenants', (table) => {
      table.boolean('private_use').defaultTo(true).alter()
    })

    this.table('estates', (table) => {
      table.string('coord_raw', 25)
    })

    this.schedule(async (trx) => {
      await Database.raw(`UPDATE estates SET coord = null`).transacting(trx)
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('coord_raw')
    })
  }
}

module.exports = TenantSchema
