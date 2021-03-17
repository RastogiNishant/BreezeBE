'use strict'

const yup = require('yup')

const phoneSchema = yup.string().matches(/^\+[0-9]{10,12}$/)

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

module.exports = {
  phoneSchema,
  verificationCodeSchema,
}
