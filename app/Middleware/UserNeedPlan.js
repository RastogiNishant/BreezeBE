'use strict'

const { ROLE_USER, PREMIUM_LANDLORD_MEMBER } = require('../constants')

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

    if (activation_status === USER_ACTIVATION_STATUS_DEACTIVATED) {
      throw new HttpException(
        USER_DEACTIVATED,
        400,
        parseInt(`${ERROR_USER_DEACTIVATED_LOGIN}${auth.user.id}`)
      )
    }

    await next()
  }
}

module.exports = UserNeedPlan
