'use strict'
const { STATUS_ACTIVE } = use('App/constants')
const TenantService = use('App/Services/TenantService')
const Tenant = use('App/Models/Tenant')
const TenantListener = (exports = module.exports = {})

TenantListener.updateTenant = async (userId) => {
  const activatedTenant = await Tenant.query()
    .where('user_id', userId)
    .where('status', STATUS_ACTIVE)
    .first()
  if (activatedTenant) {
    // we only deactivate if tenant is activated
    TenantService.deactivateTenant(userId)
  }
}
