'use strict'

const yup = require('yup')

const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')
const { SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM } = require('../constants')

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      title: yup.number().oneOf([SALUTATION_MR, SALUTATION_MS, SALUTATION_SIR_OR_MADAM]),
      full_name: yup.string().min(2).max(255),
      phone: phoneSchema,
      region: yup.string().max(255),
      avatar: yup.string().max(255),
      address: yup.string().min(10),
    })
  }
}

module.exports = UpdateContact
