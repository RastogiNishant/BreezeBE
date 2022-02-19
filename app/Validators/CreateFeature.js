'use strict'

const yup = require('yup')
const Base = require('./Base')

const {
  ROLE_LANDLORD, ROLE_USER, PLAN_FEATURE_COMMON, PLAN_FEATURE_NEW
} = require('../constants')

class CreateFeature extends Base {
  static schema = () =>
    yup.object().shape({
      feature: yup.string(),
      description: yup.string(),
      plan_id:yup.number().positive(),
      status: yup.boolean().default(true),
      prices:yup.number().positive(),
      role_id: yup.number().oneOf([ROLE_LANDLORD, ROLE_USER]),
      feature_label: yup.string().oneOf([PLAN_FEATURE_COMMON, PLAN_FEATURE_NEW])
    })
}

module.exports = CreateFeature
