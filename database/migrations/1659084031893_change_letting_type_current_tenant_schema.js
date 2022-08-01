'use strict'

const { LETTING_TYPE_LET, STATUS_DRAFT } = require('../../app/constants')

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Estate = use('App/Models/Estate')

class ChangeLettingTypeCurrentTenantSchema extends Schema {
  async up() {
    const estateCurrentTenants = (await EstateCurrentTenant.query().fetch()).rows
    await Promise.all(
      estateCurrentTenants.map(async (ect) => {
        await Estate.query()
          .where('id', ect.estate_id)
          .update({ letting_type: LETTING_TYPE_LET, status: STATUS_DRAFT })
      })
    )
  }

  down() {}
}

module.exports = ChangeLettingTypeCurrentTenantSchema
