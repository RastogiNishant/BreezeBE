'use strict'

const yup = require('yup')

const Base = require('./Base')
const { DEVICE_TYPE_ANDROID, DEVICE_TYPE_IOS, MONTHLY_PAYMENT, YEARLY_PAYMENT } = require('../constants')

class TenantPremiumPlan extends Base {
  static schema = () =>
    yup.object().shape({
      receipt: yup.string().required(),
      payment_plan: yup.number().positive().required(),
      plan_id: yup.number().positive().required(),
    })
}

module.exports = TenantPremiumPlan
