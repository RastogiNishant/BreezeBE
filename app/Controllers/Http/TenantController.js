'use strict'

const Event = use('Event')
const HttpException = use('App/Exceptions/HttpException')
const TenantService = use('App/Services/TenantService')
const MatchService = use('App/Services/MatchService')
const UserService = use('App/Services/UserService')
const Tenant = use('App/Models/Tenant')

const { without } = require('lodash')

const {
  ROLE_USER,
  ROLE_LANDLORD,
  MEMBER_FILE_TYPE_INCOME,
  STATUS_DRAFT,
} = require('../../constants')

class TenantController {
  /**
   *
   */
  async getProtectedFile({ request, auth, response }) {
    const { user_id, file_id, file_type, member_id } = request.all()
    if (auth.user.role === ROLE_USER) {
      if (+auth.user.id !== +user_id) {
        throw new HttpException('No access', 403)
      }
    } else if (auth.user.role === ROLE_LANDLORD) {
      const hasAccess = await UserService.landlordHasAccessTenant(auth.user.id, user_id)
      if (!hasAccess) {
        throw new HttpException('No access', 403)
      }
    } else {
      throw new HttpException('No access', 403)
    }

    if (file_type === MEMBER_FILE_TYPE_INCOME) {
      if (!file_id) {
        throw new HttpException('File id required', 400)
      }
    }

    try {
      const link = await TenantService.getProtectedFileLink(user_id, file_id, file_type, member_id)
      return response.res(link)
    } catch (e) {
      if (e.name === 'AppException') {
        throw new HttpException(e.message, 400)
      }
      throw e
    }
  }

  /**
   *
   */
  async updateTenant({ request, auth, response }) {
    const data = request.all()
    const tenant = await UserService.getOrCreateTenant(auth.user)
    await tenant.updateItem(data)
    const { lat, lon } = tenant.getLatLon()
    // Add tenant anchor zone processing
    if (lat && lon && tenant.dist_type && tenant.dist_min) {
      await TenantService.updateTenantIsoline(tenant.id)
    }
    const updatedTenant = await Tenant.find(tenant.id)
    // Deactivate tenant on personal data change
    if (without(Object.keys(data), ...Tenant.updateIgnoreFields).length) {
      Event.fire('tenant::update', auth.user.id)
      updatedTenant.status = STATUS_DRAFT
    } else {
      await MatchService.matchByUser(auth.user.id)
    }

    response.res(updatedTenant)
  }

  /**
   * Check is all required fields exist and change user status
   */
  async activateTenant({ auth, response }) {
    const tenant = await Tenant.query().where({ user_id: auth.user.id }).first()
    try {
      await TenantService.activateTenant(tenant)
    } catch (e) {
      console.log(e.message)
      throw new HttpException(e.message, 400)
    }
    await MatchService.matchByUser(auth.user.id)

    response.res(true)
  }

  /**
   *
   */
  async getTenantMap({ auth, response }) {
    const zone = await TenantService.getTenantZone(auth.user.id)
    response.res(zone)
  }
}

module.exports = TenantController
