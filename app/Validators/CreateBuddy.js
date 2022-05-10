'use strict'

const yup = require('yup')
const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')

class CreateBuddy extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string().max(30).required(),
      phone: phoneSchema,
      email: yup.string().email().max('255').required(),
    })
}

module.exports = CreateBuddy
