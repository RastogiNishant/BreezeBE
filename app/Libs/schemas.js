'use strict'

const yup = require('yup')

const phoneSchema = yup
  .string()
  .matches(/^\+[1-9]{1,2}[0-9]{9,11}$/, 'Phone number format is wrong')

const verificationCodeSchema = yup.string().matches(/^\d{6}$/)

const id = yup.number().positive()

const pagination = yup.object().shape({
  return_all: yup.number(),
  page: yup.number().when('return_all', {
    is: 1,
    otherwise: yup.number().positive().default(1),
  }),
  limit: yup.number().when('return_all', {
    is: 1,
    otherwise: yup.number().positive().max(1000).default(20),
  }),
})

module.exports = {
  phoneSchema,
  verificationCodeSchema,
  id,
  pagination,
}
