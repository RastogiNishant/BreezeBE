'use strict'

const yup = require('yup')
const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')

class Phone extends Base {
  static schema = () =>
    yup.object().shape({
      phone: phoneSchema.required(),
      code: yup.number().positive(),
    })
}


module.exports = Phone
