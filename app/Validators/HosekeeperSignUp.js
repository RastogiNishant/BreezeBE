'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const { phoneSchema } = require('../Libs/schemas.js')

class HosekeeperSignUp extends Base {
  static schema = () =>
    yup.object().shape({
      firstname: yup.string().min(2).max(254),
      email: yup.string().email().lowercase().required(),
      password: yup.string().trim().min(6).max(36).required(),
      // confirmPassword: yup.string().trim().min(6).max(36).required(),
      // owner_id:id.required(),
      // member_id:id.required(),
      code: yup.string().min(3).max(10).required(),
      lang: yup.string().oneOf(['en', 'de']).default('en').required(),
      // phone: phoneSchema.required(),
    })
}

module.exports = HosekeeperSignUp
