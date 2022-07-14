'use strict'
const Base = require('./Base')
const yup = require('yup')
const { SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM } = require('../constants')
const Email = require('./Email')
const { phoneSchema } = require('../Libs/schemas.js')
const Id = require('./Id')

class CreateEstateCurrentTenant extends Base {
  static schema = () =>
    yup.object().shape({
      salutation: yup.string(),
      email: Email,
      surname: yup.string().required(),
      phone_number: phoneSchema,
      estate_id: Id,
      contract_end: yup.date(),
      salutation_int: yup.number().oneOf([SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM]),
    })
}

module.exports = CreateEstateCurrentTenant
