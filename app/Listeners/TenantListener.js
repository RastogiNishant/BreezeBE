'use strict'

const TenantService = use('App/Services/TenantService')

const TenantListener = (exports = module.exports = {})

TenantListener.updateTenant = async (userId) => {
  await TenantService.deactivateTenant(userId)
}
