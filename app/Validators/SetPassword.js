'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, BOOLEAN, EMAIL, MATCH },
} = require('../exceptions')

class SetPassword extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup
        .string()
        .uppercase()
        .min(6, getExceptionMessage('code', MINLENGTH, 6))
        .required(getExceptionMessage('code', REQUIRED)),
      password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('password', MINLENGTH, 6))
        .max(36, getExceptionMessage('password', MAXLENGTH, 36))
        .required(getExceptionMessage('password', REQUIRED)),
      email: yup
        .string()
        .email(getExceptionMessage('email', EMAIL))
        .lowercase()
        .required(getExceptionMessage('email', REQUIRED)),
    })
}

module.exports = SetPassword
