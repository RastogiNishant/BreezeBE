'use strict'

const Promise = require('bluebird')

const Schema = use('Schema')
const Database = use('Database')

const Estate = use('App/Models/Estate')

class EstatesSchema extends Schema {
  up() {
    this.table('estates', (table) => {
      table.string('hash', 10).index()
    })

    this.schedule(async (trx) => {
      const estates = await Database.query().select('id').from('estates').transacting(trx)
      await Promise.map(
        estates,
        ({ id }) => {
          return Database.table('estates')
            .update('hash', Estate.getHash(id))
            .where('id', id)
            .transacting(trx)
        },
        { concurrency: 20 }
      )
    })
  }

  down() {
    this.table('estates', (table) => {
      table.dropColumn('hash')
    })
  }
}

module.exports = EstatesSchema
