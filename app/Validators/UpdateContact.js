'use strict'

const yup = require('yup')

const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')
const { SALUTATION_MR_LABEL, SALUTATION_MS_LABEL } = require('../constants')

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      title: yup.string().oneOf([SALUTATION_MR_LABEL, SALUTATION_MS_LABEL]),
      full_name: yup.string().min(2).max(255),
      phone: phoneSchema,
      region: yup.string().max(255),
      avatar: yup.string().max(255),
    })
  }
}

module.exports = UpdateContact
