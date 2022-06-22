'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const User = use('App/Models/User')
const Promise = require('bluebird')
const MemberService = use('App/Services/MemberService')

class RecalculateMemberCountsToTenantSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()
    try {
      const users = (
        await User.query().select('id').where('role', 3).whereNull('owner_id').fetch()
      ).rows

      await Promise.map(users, async (user) => {
        await MemberService.calcTenantMemberData(user.id, trx)
      })
      await trx.commit()
    } catch (e) {
console.log('RecalculateMemberCountsToTenantSchema Migration Error', e)      
      trx.rollback()
    }
  }

  down() {}
}

module.exports = RecalculateMemberCountsToTenantSchema