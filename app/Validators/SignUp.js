'use strict'

const yup = require('yup')
const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  ROLE_USER,
  ROLE_LANDLORD,
  LANDLORD_SIZE_LARGE,
  LANDLORD_SIZE_MID,
  LANDLORD_SIZE_SMALL,
} = require('../constants')

class SignUp extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD]).required(),
      password: yup.string().trim().min(6).max(36).required(),
      sex: yup.number().oneOf([GENDER_MALE, GENDER_FEMALE]).required(),
      phone: phoneSchema,
      birthday: yup.date().required(),
      lang: yup.string().oneOf(['en', 'de']).default('en').required(),
      lord_size: yup.number().oneOf([LANDLORD_SIZE_LARGE, LANDLORD_SIZE_MID, LANDLORD_SIZE_SMALL]),
      request_full_profile: yup.boolean(),
    })
}

module.exports = SignUp
