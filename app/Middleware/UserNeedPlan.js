'use strict'

const moment = require('moment')
const HttpException = require('../Exceptions/HttpException')
const EstateCurrentTenantService = require('../Services/EstateCurrentTenantService')
const {
  ROLE_USER,
  PREMIUM_LANDLORD_MEMBER,
  BASIC_LANDLORD_MEMBER,
  BASIC_PLAN_MIN_CONNECT_COUNT,
  PREMIUM_PLAN_MIN_CONNECT_COUNT,
  MEMBER_TRIAL_PERIOD
} = require('../constants')
const {
  exceptions: { ERROR_PREMIUM_MEMBER_PLAN_SELECT, ERROR_PLAN_SELECT }
} = require('../exceptions')

class UserNeedPlan {
  async handle({ auth }, next) {
    // Skip anonymous routes and admin routes check
    if (!auth?.user) {
      return next()
    }

    const { role, plan_id } = auth.user
    if (role === ROLE_USER) {
      return next()
    }

    if (process.env.PRICE_MODEL_ENABLED !== 'true') {
      return next()
    }

    if (plan_id && plan_id === PREMIUM_LANDLORD_MEMBER) {
      return next()
    }

    const estateTenantCount = await EstateCurrentTenantService.getCount(auth.user.id)

    if (plan_id && plan_id === BASIC_LANDLORD_MEMBER) {
      if (estateTenantCount > PREMIUM_PLAN_MIN_CONNECT_COUNT) {
        throw new HttpException(ERROR_PREMIUM_MEMBER_PLAN_SELECT, 400)
      }
    }

    if (!plan_id) {
      // A new user within 7 days, he can use trial
      if (
        moment.utc(auth.user.created_at).add(MEMBER_TRIAL_PERIOD, 'days').format('x') >=
        moment.utc(new Date()).format('x')
      ) {
        return next()
      }

      if (estateTenantCount > BASIC_PLAN_MIN_CONNECT_COUNT) {
        throw new HttpException(ERROR_PLAN_SELECT, 400)
      }
    }

    await next()
  }
}

module.exports = UserNeedPlan
