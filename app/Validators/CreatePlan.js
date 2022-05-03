'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD } = require('../constants')

class CreatePlan extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string(),
      description: yup.string(),
      role: yup
        .number()
        .oneOf([ROLE_USER, ROLE_LANDLORD])
        .required(),
      prospect_free_plan: yup.boolean(),
      landlord_free_plan: yup.boolean(),
      status: yup.boolean(),
      // prices: yup.number(),
    })
}

module.exports = CreatePlan
