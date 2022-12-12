'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { MINLENGTH, MAXLENGTH },
} = require('../excepions')

class ChangePassword extends Base {
  static schema = () =>
    yup.object().shape({
      current_password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('current_password', MINLENGTH, 6))
        .max(36, getExceptionMessage('current_password', MAXLENGTH, 36)),
      new_password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('new_password', MINLENGTH, 6))
        .max(36, getExceptionMessage('new_password', MAXLENGTH, 36)),
    })
}

module.exports = ChangePassword
