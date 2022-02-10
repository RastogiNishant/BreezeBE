'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')

const userPlanUpdateSQL = `
UPDATE users SET "plan_id" = 1 WHERE "plan_id" IS NULL;
`

class UserDefaultPlanSchema extends Schema {
  async up () {
    // this.schedule(async (trx) => {
    //   await Database.raw(userPlanUpdateSQL)
    // })

    this.table('users', async(table) => {
      // alter table
      await Database.raw(userPlanUpdateSQL)
      table.integer('plan_id').notNullable().defaultTo(1).alter();
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UserDefaultPlanSchema
