'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UsersAddMemberPlanDateSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.datetime('member_plan_date', { useTz: false })
    })
  }

  down () {
    this.table('users', (table) => {
      table.dropColumn('member_plan_date')
      // reverse alternations
    })
  }
}

module.exports = UsersAddMemberPlanDateSchema
