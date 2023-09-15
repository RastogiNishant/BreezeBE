'use strict'

const Event = use('Event')
const HttpException = use('App/Exceptions/HttpException')
const TenantService = use('App/Services/TenantService')
const MatchService = use('App/Services/MatchService')
const UserService = use('App/Services/UserService')
const MemberService = use('App/Services/MemberService')
const TenantCertificateService = use('App/Services/TenantCertificateService')
const CityService = use('App/Services/CityService')
const Tenant = use('App/Models/Tenant')
const Database = use('Database')
const { without, omit } = require('lodash')
const Logger = use('Logger')
const moment = require('moment')
const {
  ROLE_USER,
  ROLE_LANDLORD,
  MEMBER_FILE_TYPE_INCOME,
  STATUS_DRAFT,
  STATUS_ACTIVE,
  LOG_TYPE_ACTIVATED_PROFILE,
  MEMBER_FILE_TYPE_PASSPORT,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  MEMBER_FILE_TYPE_EXTRA_PASSPORT,
  NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID,
} = require('../../constants')

const { logEvent } = require('../../Services/TrackingService')

class TenantController {
  /**
   *
   */
  async getProtectedFile({ request, auth, response }) {
    const { user_id, file_id, file_type, member_id } = request.all()
    if (auth.user.role === ROLE_USER) {
      if (+auth.user.id !== +user_id && +auth.user.owner_id !== +user_id) {
        //MERGED TENANT
        throw new HttpException('No access', 403)
      }
    } else if (auth.user.role === ROLE_LANDLORD) {
      //TODO: WARNING: SECURITY
      let hasAccess = true
      // let hasAccess = await UserService.landlordHasAccessTenant(auth.user.id, user_id)
      // if (!hasAccess) {
      //   const fileOwner = await User.query().where('id', user_id).first()
      //   if (fileOwner && fileOwner.owner_id) {
      //     hasAccess = await UserService.landlordHasAccessTenant(auth.user.id, fileOwner.owner_id)
      //   }
      // }
      if (!hasAccess) {
        throw new HttpException('No access', 403)
      }
    } else {
      throw new HttpException('No access', 403)
    }

    if (
      [
        MEMBER_FILE_TYPE_PASSPORT,
        MEMBER_FILE_TYPE_EXTRA_PASSPORT,
        MEMBER_FILE_TYPE_EXTRA_RENT,
        MEMBER_FILE_TYPE_EXTRA_DEBT,
        MEMBER_FILE_TYPE_INCOME,
      ].includes(file_type)
    ) {
      if (!file_id) {
        throw new HttpException('File id required', 400)
      }
    }

    const memberUserId =
      auth.user.role === ROLE_LANDLORD ? user_id : auth.user.owner_id || auth.user.id

    try {
      const link = await TenantService.getProtectedFileLink(
        memberUserId,
        file_id,
        file_type,
        member_id
      )
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
    const trx = await Database.beginTransaction()

    try {
      const tenant = await UserService.getOrCreateTenant(auth.user, trx)

      if (!Array.isArray(data.income_level) || data.income_level.length === 0) {
        data.is_public_certificate = false
      } else {
        data.is_public_certificate = true
      }

      if (
        data.transfer_budget_min &&
        data.transfer_budget_max &&
        data.transfer_budget_min > data.transfer_budget_max
      ) {
        throw new HttpException('Transfer budget min has to be smaller than max', 400)
      }

      if (!data.is_short_term_rent) {
        data.residency_duration_min = null
        data.residency_duration_max = null
      }
      // Deactivate tenant on personal data change
      const shouldDeactivateTenant = without(
        Object.keys(omit(data, ['only_count'])),
        ...Tenant.updateIgnoreFields
      ).length

      if (shouldDeactivateTenant) {
        tenant.notify_sent = [NOTICE_TYPE_TENANT_PROFILE_FILL_UP_ID]
        tenant.status = STATUS_DRAFT
      } else {
      }
      await tenant.updateItemWithTrx(omit(data, ['only_count']), trx)

      await trx.commit()

      // Add tenant anchor zone processing
      const { lat, lon } = tenant.getLatLon()
      if (lat !== undefined && lat !== null && lon !== undefined && lon !== null) {
        await TenantService.updateTenantIsoline({ tenantId: tenant.id })
      }

      if (shouldDeactivateTenant) {
        Event.fire('tenant::update', auth.user.id)
      }
      Logger.info(`Before QueueService ${auth.user.id} ${moment.utc(new Date()).toISOString()}`)

      let filterResult = {}

      if (data.only_count) {
        filterResult = await MatchService.matchByUser({
          userId: auth.user.id,
          has_notification_sent: false,
          only_count: true,
        })
      } else {
        filterResult = await MatchService.matchByUser({
          userId: auth.user.id,
          has_notification_sent: false,
        })
      }

      response.res({ tenant: await Tenant.find(tenant.id), filter: filterResult })
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, 400, e.code)
    }
  }

  /**
   * Check is all required fields exist and change user status
   */
  async activateTenant({ auth, response, request }) {
    const tenant = await Tenant.query().where({ user_id: auth.user.id }).first()
    try {
      await TenantService.activateTenant(tenant)
      logEvent(request, LOG_TYPE_ACTIVATED_PROFILE, auth.user.id, {}, false)
      Event.fire('mautic:syncContact', auth.user.id, { activated_profile_date: new Date() })
    } catch (e) {
      console.log(`activateTenant controller error ${auth.user.id} ${e.message}`)
      throw new HttpException(e.message, 400, e.code)
    } finally {
      await MatchService.matchByUser({ userId: auth.user.id, ignoreNullFields: true })
    }

    response.res(true)
  }

  async detail({ request, auth, response }) {
    let tenant = await TenantService.getTenantWithCertificates(auth.user.id)
    let members = await MemberService.getMembers(auth.user.id, true)
    response.res({
      tenant,
      members,
    })
  }

  /**
   *
   */
  async getTenantMap({ auth, response }) {
    const zone = await TenantService.getTenantZone(auth.user.id)
    response.res(zone)
  }

  async getAllTenants({ request, auth, response }) {
    const { skip = 0, limit = 50 } = request.all()
    const tenants = await Tenant.query().limit(limit).offset(skip).fetch()
    response.res(tenants || [])
  }

  async acceptBuddyInvite({ request, auth, response }) {
    // represents landlord's uid
    const { uid } = request.all()
    const { id } = auth.user
    try {
      await UserService.proceedBuddyInviteLink(uid, id)
    } catch (e) {
      throw new HttpException(e.message, 400, e.code)
    }
  }

  async tenantCountByCreditScore({ request, auth, response }) {
    const { credit_score_min, credit_score_max } = request.all()
    response.res(await TenantService.getCountByFilter({ credit_score_min, credit_score_max }))
  }

  async tenantCountByBudget({ request, auth, response }) {
    const { budget_min, budget_max } = request.all()
    response.res(await TenantService.getCountByFilter({ budget_min, budget_max }))
  }

  async tenantCount({ request, auth, response }) {
    const phoneVerifiedCount = await MemberService.getPhoneVerifieldCount()
    const idVerifiedCount = await MemberService.getIdVerifiedCount()
    const incomeCounts = await MemberService.getIncomesCountByFilter()
    response.res({
      phone: phoneVerifiedCount,
      id: idVerifiedCount,
      income: incomeCounts,
    })
  }

  async requestCertificate({ request, auth, response }) {
    const { request_certificate_at, request_certificate_city_id } = request.all()
    await TenantService.requestCertificate({
      user_id: auth.user.id,
      request_certificate_at,
      request_certificate_city_id,
    })

    let city = null
    if (request_certificate_city_id) {
      city = await CityService.get(request_certificate_city_id)
    }

    //TODO: need to send wbs link from city table. coming soon
    response.res({
      request_certificate_at,
      city,
    })
  }

  async removeRequestCertificate({ request, auth, response }) {
    const trx = await Database.beginTransaction()
    try {
      await TenantCertificateService.deleteCertificate({ user_id: auth.user.id }, trx)
      const deleteCertificateResult = await TenantService.requestCertificate(
        {
          user_id: auth.user.id,
          request_certificate_at: null,
          request_certificate_city_id: null,
        },
        trx
      )
      await trx.commit()
      response.res(deleteCertificateResult)
    } catch (e) {
      await trx.rollback()
      throw new HttpException(e.message, e.status || 400)
    }
  }
}

module.exports = TenantController
