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
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  ROLE_PROPERTY_MANAGER,
} = require('../constants')

class HoseholdSignUp extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      password: yup.string().trim().min(6).max(36).required(),
      confirmPassword: yup.string().trim().min(6).max(36).required(),
      phone: phoneSchema.required(),
    })
}


module.exports = HoseholdSignUp
