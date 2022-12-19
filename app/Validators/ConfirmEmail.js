'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, NUMBER },
} = require('../excepions')

class ConfirmEmail extends Base {
  static schema = () =>
    yup.object().shape({
      user_id: yup
        .number()
        .typeError(getExceptionMessage('user_id', NUMBER))
        .positive()
        .required(getExceptionMessage('user_id', REQUIRED)),
      from_web: yup.number().typeError(getExceptionMessage('from_web', NUMBER)),
      code: yup.string().trim().required(getExceptionMessage('code', REQUIRED)),
    })
}

module.exports = ConfirmEmail
