'use strict'

const yup = require('yup')

const Base = require('./Base')

class DeviceToken extends Base {
  static schema = () =>
    yup.object().shape({
      device_token: yup.string().min(30).required(),
    })
}

module.exports = DeviceToken
