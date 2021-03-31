'use strict'

const yup = require('yup')
const { ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN } = require('../constants')

class SignInGoogle {
  static schema = () =>
    yup.object().shape({
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN]), //.required(),
      device_token: yup.string().min(30).nullable(),
    })
}

module.exports = SignInGoogle
