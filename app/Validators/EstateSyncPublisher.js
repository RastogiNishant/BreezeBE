'use strict'

const yup = require('yup')
const Base = require('./Base')

const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')
const { THIRD_PARTY_PUBLISHERS } = require('../constants')

class EstateSyncPublisher extends Base {
  static schema = () =>
    yup.object().shape({
      publisher: yup
        .string()
        .oneOf(THIRD_PARTY_PUBLISHERS)
        .required(getExceptionMessage('publisher id', REQUIRED)),
    })
}

module.exports = EstateSyncPublisher
