'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const { phoneSchema } = require('../Libs/schemas.js')

class HoseholdSignUp extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      password: yup.string().trim().min(6).max(36).required(),
      confirmPassword: yup.string().trim().min(6).max(36).required(),
      owner_id:id.required(),
      member_id:id.required(),
      code:yup.string().min(3).max(10).required(),
      phone: phoneSchema.required(),
    })
}


module.exports = HoseholdSignUp
