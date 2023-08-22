'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, POSITIVE_NUMBER },
} = require('../exceptions.js')
const Base = require('./Base')

class Stage extends Base {
  static schema = () =>
    yup.object().shape({
      stage: yup
        .string()
        .oneOf(['invites', 'visits', 'final'])
        .required(getExceptionMessage('stage', REQUIRED)),
    })
}

module.exports = Stage
