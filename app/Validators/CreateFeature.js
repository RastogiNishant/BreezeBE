'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateFeature extends Base {
  static schema = () =>
    yup.object().shape({
      feature: yup.string(),
      description: yup.string(),
      is_basic_plan: yup.boolean().default(false),
      belong_to_basic_plan:yup.boolean().default(false),
      is_premium_plan: yup.boolean().default(false),
      belong_to_premium_plan:yup.boolean().default(false),
      status: yup.boolean().default(true),
      prices:yup.number().positive()
    })
}

module.exports = CreateFeature
