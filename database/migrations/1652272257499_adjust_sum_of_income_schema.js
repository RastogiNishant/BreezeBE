'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const UserService = use('App/Services/UserService')

const { ROLE_USER } = require('../../app/constants')
const MemberService = use('App/Services/MemberService')

class AdjustSumOfIncomeSchema extends Schema {
  async up() {
    const trx = await Database.beginTransaction()
    const prospects = await UserService.getByRole(ROLE_USER)
    try {
      await Promise.all(
        prospects.map(async (prospect) => {
          await MemberService.updateTenantIncome(
            prospect.owner_id || prospect.id,
            trx
          )
        })
      )
      await trx.commit()
      console.log("updated all tenants' income")
    } catch (e) {
      await trx.rollback()
      console.log(e.message)
    }
  }

  down() {}
}

module.exports = AdjustSumOfIncomeSchema
