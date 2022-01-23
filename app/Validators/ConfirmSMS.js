'use strict'

const yup = require('yup')
const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')

class ConfirmSMS extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      phone: phoneSchema.required(),
      code: yup.number().positive(),
    })
}


module.exports = ConfirmSMS
