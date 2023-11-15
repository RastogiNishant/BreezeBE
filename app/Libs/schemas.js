'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { MATCH, POSITIVE_NUMBER }
} = require('../exceptions')

const { validationRegexp } = require('../helper')

const SCHEMAS = {
  id: yup.number().positive().typeError(getExceptionMessage('id', POSITIVE_NUMBER)),

  phone: yup
    .string()
    .matches(validationRegexp.PHONE_REG_EXP, getExceptionMessage(undefined, MATCH)),

  verificationCode: yup.string().matches(/^\d{6}$/),

  pagination: yup.object().shape({
    page: yup.number().positive(),
    limit: yup.number().positive()
  })
}

module.exports = SCHEMAS
