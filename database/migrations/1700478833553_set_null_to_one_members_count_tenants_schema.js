'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Tenant = use('App/Models/Tenant')

class SetNullToOneMembersCountTenantsSchema extends Schema {
  async up() {
    await Tenant.query()
      .update({ members_count: 1 })
      .where(function (q) {
        q.orWhereNull('members_count')
        q.orWhere('members_count', 0)
      })
  }

  down() {}
}

module.exports = SetNullToOneMembersCountTenantsSchema
