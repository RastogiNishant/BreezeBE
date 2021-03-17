'use strict'

const yup = require('yup')

class SignIn {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      password: yup.string().trim().min(6).max(36).required(),
      device_token: yup.string().min(30).nullable(),
    })
}

module.exports = SignIn
