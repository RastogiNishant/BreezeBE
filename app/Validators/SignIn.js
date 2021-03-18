'use strict'

const yup = require('yup')
const { ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN } = require('../constants')

class SignIn {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN]).required(),
      password: yup.string().trim().min(6).max(36).required(),
      device_token: yup.string().min(30).nullable(),
    })
}

module.exports = SignIn
