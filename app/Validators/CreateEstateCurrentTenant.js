'use strict'
const Base = require('./Base')
const yup = require('yup')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_NEUTRAL,
  GENDER_ANY,
} = require('../constants')
const { phoneSchema, id } = require('../Libs/schemas.js')

class CreateEstateCurrentTenant extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().max('255').nullable(),
      surname: yup.string().required(),
      phone_number: phoneSchema.nullable(),
      estate_id: id.required(),
      contract_end: yup.date().nullable(),
      salutation_int: yup
        .number()
        .oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_NEUTRAL, GENDER_ANY])
        .required(),
    })
}

module.exports = CreateEstateCurrentTenant
