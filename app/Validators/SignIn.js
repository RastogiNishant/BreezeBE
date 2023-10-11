'use strict'

const yup = require('yup')

const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN, ROLE_PROPERTY_MANAGER } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, BOOLEAN, EMAIL, MATCH }
} = require('../exceptions')

class SignIn extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup
        .string()
        .email(getExceptionMessage('email', EMAIL))
        .lowercase()
        .required(getExceptionMessage('email', REQUIRED)),
      role: yup
        .number()
        .oneOf(
          [ROLE_USER, ROLE_LANDLORD, ROLE_ADMIN, ROLE_PROPERTY_MANAGER],
          getExceptionMessage(
            'role',
            OPTION,
            `[${ROLE_USER},${ROLE_LANDLORD},${ROLE_PROPERTY_MANAGER}]`
          )
        )
        .required(getExceptionMessage('role', REQUIRED)),
      password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('password', MINLENGTH, 6))
        .max(36, getExceptionMessage('password', MAXLENGTH, 36))
        .required(getExceptionMessage('password', REQUIRED)),
      device_token: yup
        .string()
        .min(30, getExceptionMessage('password', MINLENGTH, 30))
        .nullable(),
      from_web: yup.number().oneOf([1]).nullable(),
      landlord_email: yup.string().email(getExceptionMessage('email', EMAIL)).lowercase()
    })
}

module.exports = SignIn
