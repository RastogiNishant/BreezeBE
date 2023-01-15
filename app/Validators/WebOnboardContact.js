'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED },
} = require('../exceptions')

class WebOnboardContact extends Base {
  static schema = () =>
    yup.object().shape({
      is_onboard: yup.boolean(),
      address: yup.string().when(['is_onboard'], {
        is: (is_onboard) => {
          return is_onboard
        },
        then: yup.string().min(10).required(),
        otherwise: null,
      }),
    })
}

module.exports = WebOnboardContact
