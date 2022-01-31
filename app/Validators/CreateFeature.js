'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateFeature extends Base {
  static schema = () =>
    yup.object().shape({
      feature: yup.string(),
      description: yup.string(),
      plan_id:yup.number().positive(),
      status: yup.boolean().default(true),
      prices:yup.number().positive()
    })
}

module.exports = CreateFeature
