'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
    MONTHLY_PAYMENT,
    YEARLY_PAYMENT
  } = require('../constants')
  
class TenantPaymentPlan extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string().required(),
      plan_id: yup.number().positive().required(),
      plan_option:yup.number().positive().oneOf([MONTHLY_PAYMENT, YEARLY_PAYMENT]).required(),
      price: yup.number().positive(),
      description:yup.string(),
      subscription_sku:yup.string(),
    })
}

module.exports = TenantPaymentPlan