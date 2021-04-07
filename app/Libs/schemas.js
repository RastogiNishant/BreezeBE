'use strict'

const yup = require('yup')

const phoneSchema = yup.string().matches(/^\+[0-9]{10,12}$/)

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

const id = yup.number().positive()

module.exports = {
  phoneSchema,
  verificationCodeSchema,
  id,
}
