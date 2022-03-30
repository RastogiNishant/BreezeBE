'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER } = require('../constants')

class SignInAppleMobile extends Base {
  static schema = () =>
    yup.object().shape({
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]).required(),
      token: yup.string().min(30).max(1600).required(),
      device_token: yup.string().min(30).max(255),
      owner_id: yup.number().positive(),
      member_id: yup.number().positive(),
      code: yup.string(),
    })
}

module.exports = SignInAppleMobile
