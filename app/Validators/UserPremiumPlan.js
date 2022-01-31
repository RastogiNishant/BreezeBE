'use strict'

const yup = require('yup')

const Base = require('./Base')
const { BASIC_MEMBER, PENDING_PREMIUM_MEMBER, MONTHLY_PAYMENT, YEARLY_PAYMENT } = require('../constants')

class UserPremiumPlan extends Base {
  static schema = () =>
    yup.object().shape({
      receipt: yup.string(),
      payment_plan: yup.number().positive().oneOf([MONTHLY_PAYMENT, YEARLY_PAYMENT]),
      plan_id: yup.number().positive()
    })
}

module.exports = UserPremiumPlan
