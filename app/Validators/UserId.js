'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

class UserId extends Base {
  static schema = () =>
    yup.object().shape({
      user_id: id.required(getExceptionMessage('user_id', REQUIRED)),
    })
}

module.exports = UserId
