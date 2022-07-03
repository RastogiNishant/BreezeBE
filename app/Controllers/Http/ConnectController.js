'use strict'
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Database = use('Database')

class ConnectController {
  async landlordInfo({ response, auth }) {
    const occupiedProperties = await EstateCurrentTenant.query()
      .select('estate_current_tenants.*')
      .select(Database.raw(`_t.dtasks as property_tasks`))
      .select(Database.raw(`_e.estate`))
      .leftJoin(
        Database.raw(
          `(select id, user_id, json_agg(estates.*) as estate from estates group by id) as _e`
        ),
        function () {
          this.on('_e.id', 'estate_current_tenants.estate_id').on('_e.user_id', auth.user.id)
        }
      )
      .leftJoin(
        Database.raw(
          `(select id, estate_id, json_agg(tasks.*) as dtasks from tasks group by id) as _t`
        ),
        '_e.id',
        '_t.estate_id'
      )
      .with('estate')
      .with('user')
      .fetch()
    return response.res(occupiedProperties)
  }

  async tenantInfo({ response, auth }) {
    const occupiedProperties = await EstateCurrentTenant.query()
      .select('estate_current_tenants.*')
      .select(Database.raw(`_t.dtasks as property_tasks`))
      .select(Database.raw(`_e.estate`))
      .leftJoin(
        Database.raw(
          `(select id, user_id, json_agg(estates.*) as estate from estates group by id) as _e`
        ),
        function () {
          this.on('_e.id', 'estate_current_tenants.estate_id')
        }
      )
      .leftJoin(
        Database.raw(
          `(select id, estate_id, json_agg(tasks.*) as dtasks from tasks group by id) as _t`
        ),
        '_e.id',
        '_t.estate_id'
      )
      .with('estate')
      .where('estate_current_tenants.user_id', auth.user.id)
      .fetch()
    return response.res(occupiedProperties)
  }
}

module.exports = ConnectController
