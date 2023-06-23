'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, EMAIL, OPTION, MINLENGTH, MAXLENGTH },
} = require('./../exceptions')
const { ROLE_LANDLORD, ROLE_USER } = require('../constants')
const Base = require('./Base')

class AdminAddUser extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup
        .string()
        .email(getExceptionMessage('email', EMAIL))
        .lowercase()
        .required(getExceptionMessage('email', REQUIRED)),
      password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('password', MINLENGTH, 6))
        .max(36, getExceptionMessage('password', MAXLENGTH, 36))
        .required(getExceptionMessage('password', REQUIRED)),
      role: yup
        .number()
        .oneOf(
          [ROLE_USER, ROLE_LANDLORD],
          getExceptionMessage('role', OPTION, `[${ROLE_USER},${ROLE_LANDLORD}]`)
        )
        .required(getExceptionMessage('role', REQUIRED)),
    })
}

module.exports = AdminAddUser
