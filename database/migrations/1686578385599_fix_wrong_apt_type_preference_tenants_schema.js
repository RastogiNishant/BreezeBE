'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Database = use('Database')
const Tenant = use('App/Models/Tenant')
const Promise = use('bluebird')

class FixWrongAptTypePreferenceTenantsSchema extends Schema {
  async up() {
    //query tenants with apt_type array containing 13 and 14
    //the old values of APARTMENT_TYPE_ATTIC and APARTMENT_TYPE_RAW_ATTIC
    //respectively
    const tenants = await Tenant.query()
      .select(Database.raw('id, apt_type'))
      .where(Database.raw(`14=ANY(apt_type)`))
      .orWhere(Database.raw(`13=ANY(apt_type)`))
      .fetch()
    await Promise.map(tenants.toJSON(), async (tenant) => {
      const aptTypes = tenant.apt_type
      const validTypes = aptTypes.filter((aptType) => [13, 14].indexOf(+aptType) == -1)
      //add to validTypes 12 (APARTMENT_TYPE_ATTIC)
      await Tenant.query()
        .where('id', tenant.id)
        .update({ apt_type: [...validTypes, 12] })
    })
  }

  down() {}
}

module.exports = FixWrongAptTypePreferenceTenantsSchema
