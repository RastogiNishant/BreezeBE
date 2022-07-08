const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Database = use('Database')
const moment = require('moment')

const { ROLE_USER, STATUS_ACTIVE, STATUS_EXPIRE, DAY_FORMAT } = require('../constants')

class EstateCurrentTenantService {
  static async addCurrentTenant(data, estate_id) {
    let user = await User.query().where('email', data.tenant_email).where('role', ROLE_USER).first()

    let currentTenant = new EstateCurrentTenant()
    currentTenant.fill({
      estate_id,
      salutation: data.txt_salutation || '',
      surname: data.surname || '',
      email: data.tenant_email,
      contract_end: data.contract_end,
      phone_number: data.tenant_tel,
      status: STATUS_ACTIVE,
      salutation_int: data.salutation_int,
    })
    if (user) {
      currentTenant.user_id = user.id
    }
    await currentTenant.save()
    return currentTenant
  }

  static async updateCurrentTenant(data, estate_id) {
    let user = await User.query().where('email', data.tenant_email).where('role', ROLE_USER).first()

    let currentTenant = await EstateCurrentTenant.query()
      .where('estate_id', estate_id)
      .where('email', data.tenant_email)
      .first()
    if (!currentTenant) {
      //Current Tenant is EMPTY OR NOT the same, so we make current tenants expired and add active tenant
      await Database.table('estate_current_tenants')
        .where('estate_id', estate_id)
        .update({ status: STATUS_EXPIRE })

      let newCurrentTenant = new EstateCurrentTenant()
      newCurrentTenant.fill({
        estate_id,
        salutation: data.txt_salutation || '',
        surname: data.surname || '',
        email: data.tenant_email,
        contract_end: data.contract_end,
        phone_number: data.tenant_tel,
        status: STATUS_ACTIVE,
        salutation_int: data.salutation_int,
      })
      if (user) {
        newCurrentTenant.user_id = user.id
      }
      await newCurrentTenant.save()
      return newCurrentTenant
    } else {
      //update values except email...
      currentTenant.fill({
        id: currentTenant.id,
        salutation: data.txt_salutation,
        surname: data.surname,
        contract_end: data.contract_end,
        phone_number: data.tenant_tel,
        salutation_int: data.salutation_int,
      })
      if (user) {
        currentTenant.user_id = user.id
      }
      await currentTenant.save()
      return currentTenant
    }
  }

  static async getAllOutsideTenant(id) {
    const today = moment.utc(new Date(), DAY_FORMAT)
    return (
      await EstateCurrentTenant.query()
        .select('estate_current_tenants.*', Database.raw('0 as inside_breeze'))
        .innerJoin({ _e: 'estates' }, function () {
          this.on('_e.id', 'estate_current_tenants.estate_id')
          this.on('_e.user_id', id)
        })
        .where('estate_current_tenants.status', STATUS_ACTIVE)
        .where('estate_current_tenants.contract_end', '>=', today)
        .fetch()
    ).rows
  }
}

module.exports = EstateCurrentTenantService
