'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { MATCH, POSITIVE_NUMBER },
} = require('../exceptions')

const { PHONE_REG_EXP } = require('../constants')
const phoneSchema = yup.string().matches(PHONE_REG_EXP, getExceptionMessage(undefined, MATCH))

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

const id = yup.number().positive().typeError(getExceptionMessage('id', POSITIVE_NUMBER))

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
