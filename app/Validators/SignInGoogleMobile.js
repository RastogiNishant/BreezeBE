'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD } = require('../constants')

class SignInGoogleMobile extends Base {
  static schema = () =>
    yup.object().shape({
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD]),
      token: yup.string().min(30).max(1600).required(),
      device_token: yup.string().min(30).max(255),
    })
}

module.exports = SignInGoogleMobile
