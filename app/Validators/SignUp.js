'use strict'

const yup = require('yup')
const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
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

class SignUp extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      role: yup.number().oneOf([ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER]).required(),
      signupData: yup
        .object()
        .shape({
          address: yup.object().shape({
            title: yup.string(),
            coord: yup.string().matches(/^\d{1,3}\.\d{5,8}\,\d{1,3}\.\d{5,8}$/),
          }),
          transport: yup
            .string()
            .oneOf([TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL]),
          time: yup.number().integer().oneOf([15, 30, 45, 60]),
        })
        .nullable(),
      password: yup.string().trim().min(6).max(36).required(),
      sex: yup.number().oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_ANY]).required(),
      phone: phoneSchema,
      firstname: yup.string().min(2).max(254),
      secondname: yup.string().min(2).max(254),
      birthday: yup.date().required(),
      lang: yup.string().oneOf(['en', 'de']).default('en').required(),
      lord_size: yup.number().oneOf([LANDLORD_SIZE_LARGE, LANDLORD_SIZE_MID, LANDLORD_SIZE_SMALL]),
      request_full_profile: yup.boolean(),
      landlord_email: yup.string().email().lowercase(),
      landlord_confirm_email: yup.string().email().lowercase(),
      from_web: yup.boolean(),
      data1: yup.string(),
      data2: yup.string(),
    })
}

module.exports = SignUp
