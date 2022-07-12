const User = use('App/Models/User')
const EstateCurrentTenant = use('App/Models/EstateCurrentTenant')
const Database = use('Database')
const moment = require('moment')

const {
  ROLE_USER,
  STATUS_ACTIVE,
  STATUS_EXPIRE,
  DAY_FORMAT,
  SALUTATION_SIR_OR_MADAM,
} = require('../constants')

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

  static async createOnFinalMatch(tenant_id, estate_id, trx) {
    const tenantUser = await User.query().where('id', tenant_id).firstOrFail()

    const currentTenant = new EstateCurrentTenant()
    currentTenant.fill({
      estate_id,
      user_id: tenant_id,
      surname: tenantUser.secondname || '',
      email: tenantUser.email,
      contract_end: moment().utc().add(1, 'years').format(DAY_FORMAT),
      phone_number: tenantUser.phone_number || '',
      status: STATUS_ACTIVE,
      salutation_int: SALUTATION_SIR_OR_MADAM,
    })

    await currentTenant.save(trx)
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
}

module.exports = EstateCurrentTenantService
