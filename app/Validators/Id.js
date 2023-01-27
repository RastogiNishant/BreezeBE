'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

class Id extends Base {
  static schema = () =>
    yup.object().shape({
      id: id.required(getExceptionMessage('id', REQUIRED)),
    })
}

module.exports = Id
