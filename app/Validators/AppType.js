'use strict'

const yup = require('yup')
const { DEVICE_TYPE_ANDROID, DEVICE_TYPE_IOS } = require('../constants')

const Base = require('./Base')
class AppType extends Base {
  static schema = () =>
    yup.object().shape({
        app: yup.string().oneOf([DEVICE_TYPE_ANDROID, DEVICE_TYPE_IOS]).required(),
    })
}

module.exports = AppType