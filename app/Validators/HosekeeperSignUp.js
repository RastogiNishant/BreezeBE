'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const { phoneSchema } = require('../Libs/schemas.js')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, BOOLEAN, EMAIL, MATCH, INVALID },
} = require('../exceptions')

class HosekeeperSignUp extends Base {
  static schema = () =>
    yup.object().shape({
      firstname: yup.string().min(2).max(254),
      email: yup.string().email().lowercase().required(),
      password: yup.string().trim().min(6).max(36).required(),
      // confirmPassword: yup.string().trim().min(6).max(36).required(),
      // owner_id:id.required(),
      // member_id:id.required(),
      code: yup.string().min(3).required(),
      lang: yup.string().oneOf(['en', 'de']).default('en').required(),
      // phone: phoneSchema.required(),
      ip: yup
        .string()
        .min(7, MINLENGTH)
        .max(45, MAXLENGTH)
        //just crude validation for now just numbers and : and .
        .matches(/^[0-9a-f:.]+$/, getExceptionMessage('Ip Address', INVALID)),
      ip_based_info: yup.object().shape({
        country_code: yup.string(),
        country_name: yup.string(),
        city: yup.string().nullable(),
        postal: yup.string().nullable(),
        latitude: yup.string().nullable(),
        longitude: yup.string().nullable(),
      }),
    })
}

module.exports = HosekeeperSignUp
