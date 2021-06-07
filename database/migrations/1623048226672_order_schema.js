'use strict'

const Schema = use('Schema')
const Database = use('Database')

class OrderSchema extends Schema {
  up() {
    this.table('matches', (table) => {
      table.integer('order_tenant').unsigned().defaultTo(0).alter()
      table.integer('order_lord').unsigned().defaultTo(0).alter()
    })

    this.schedule(async (trx) => {
      await Database.raw(
        `UPDATE matches SET order_tenant = 1, order_lord = 1 WHERE 1 = 1`
      ).transacting(trx)
    })
  }

  down() {
    this.table('matches', (table) => {
      // reverse alternations
    })
  }
}

module.exports = OrderSchema
