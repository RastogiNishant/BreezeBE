'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const EstateCurrentTenantService = use('App/Services/EstateCurrentTenantService')
const Database = use('Database')
const { omit } = require('lodash')

class AdjustDataEstateCurrentTenantSchema extends Schema {
  async up() {
    const estateCurrentTenants = (await EstateCurrentTenant.query().fetch()).toJSON()
    const trx = await Database.beginTransaction()
    try {
      await Promise.all(
        estateCurrentTenants.map(async (estateCurrentTenant) => {
          estateCurrentTenant = await EstateCurrentTenantService.correctData(estateCurrentTenant)
          await EstateCurrentTenant.query()
            .update({ ...omit(estateCurrentTenant, ['id', 'updated_at', 'created_at']) })
            .where('id', estateCurrentTenant.id)
            .transacting(trx)
        })
      )
      await trx.commit()
    } catch (e) {
      console.log('migration error=', e.message)
      await trx.rollback()
    }
  }

  down() {}
}

module.exports = AdjustDataEstateCurrentTenantSchema
