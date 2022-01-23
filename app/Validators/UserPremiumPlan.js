'use strict'

const yup = require('yup')

const Base = require('./Base')
const { BASIC_MEMBER, PENDING_PREMIUM_MEMBER, MONTHLY_PAYMENT, YEARLY_PAYMENT } = require('../constants')

class UserPremiumPlan extends Base {
  static schema = () =>
    yup.object().shape({
      is_premium: yup.number().positive().oneOf([BASIC_MEMBER, PENDING_PREMIUM_MEMBER]),
      payment_plan: yup.number().positive().oneOf([MONTHLY_PAYMENT, YEARLY_PAYMENT]),
      premiums: yup.array().of(yup.number().integer().positive()),
    })
}

module.exports = UserPremiumPlan
