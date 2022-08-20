'use strict'
const Base = require('./Base')
const yup = require('yup')
const { SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM } = require('../constants')
const { phoneSchema, id } = require('../Libs/schemas.js')

class CreateEstateCurrentTenant extends Base {
  static schema = () =>
    yup.object().shape({
      tenant_email: yup.string().email().max('255'),
      surname: yup.string().required(),
      phone_number: phoneSchema,
      estate_id: id.required(),
      contract_end: yup.date(),
      salutation_int: yup
        .number()
        .oneOf([SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM])
        .required(),
    })
}

module.exports = CreateEstateCurrentTenant
