'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { MINLENGTH, MAXLENGTH, INVALID },
} = require('../exceptions')

class SignInAppleMobile extends Base {
  static schema = () =>
    yup.object().shape({
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]).required(),
      token: yup.string().min(30).max(1600).required(),
      device_token: yup.string().min(30).max(255),
      owner_id: yup.number().positive(),
      member_id: yup.number().positive(),
      code: yup.string(),
      ip: yup
        .string()
        .min(7, MINLENGTH)
        .max(45, MAXLENGTH)
        .matches(/^[0-9a-f:.]+$/, getExceptionMessage('Ip Address', INVALID)),
      ip_based_info: yup.object().shape({
        country_code: yup.string(),
        country_name: yup.string(),
        city: yup.string().nullable(),
        postal: yup.string().nullable(),
        latitude: yup.string().nullable(),
        longitude: yup.string().nullable(),
      }),
    })
}

module.exports = SignInAppleMobile
