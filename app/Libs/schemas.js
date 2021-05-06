'use strict'

const yup = require('yup')

const phoneSchema = yup.string().matches(/^\+[0-9]{10,12}$/)

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

const id = yup.number().positive()

const pagination = yup.object().shape({
  page: yup.number().positive().default(1),
  limit: yup.number().positive().max(20).default(20),
})

module.exports = {
  phoneSchema,
  verificationCodeSchema,
  id,
  pagination,
}
