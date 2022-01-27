'use strict'

const yup = require('yup')

const Base = require('./Base')
class UserVerify extends Base {
  static schema = () =>
    yup.object().shape({
      is_verify: yup.boolean().required(),
    })
}

module.exports = UserVerify