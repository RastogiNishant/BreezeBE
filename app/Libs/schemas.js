'use strict'

const yup = require('yup')
const { PHONE_REG_EXP } = require('../constants')
const phoneSchema = yup.string().matches(PHONE_REG_EXP, 'Phone number format is wrong')

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

const id = yup.number().positive()

const pagination = yup.object().shape({
  page: yup.number().positive(),
  limit: yup.number().positive(),
})

module.exports = {
  phoneSchema,
  verificationCodeSchema,
  id,
  pagination,
}
