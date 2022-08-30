'use strict'

const yup = require('yup')

const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const _ = require('lodash')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
  IS_PUBLIC,
  IS_PRIVATE,
  LANDLORD_SIZE_SMALL,
  LANDLORD_SIZE_MID,
  LANDLORD_SIZE_LARGE,
  CONNECT_SERVICE_INDEX,
  MATCH_SERVICE_INDEX,
} = require('../constants')

class UpdateUser extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email(),
      password: yup
        .string()
        .trim()
        .min(6)
        .max(36)
        .when(['email'], {
          is: (email) => !_.isEmpty(email),
          then: yup.string().required('Change on email requires current password.'),
        }),
      file: yup.mixed(),
      sex: yup.number().oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_ANY]),
      phone: phoneSchema,
      birthday: yup.date(),
      firstname: yup.string().min(2).max(254),
      secondname: yup.string().min(2).max(254),
      lang: yup.string().oneOf(['en', 'de']),
      avatar: yup.string().max(512),
      notice: yup.boolean(),
      prospect_visibility: yup.number().oneOf([IS_PRIVATE, IS_PUBLIC]),
      landlord_visibility: yup.number().oneOf([IS_PRIVATE, IS_PUBLIC]),
      company_name: yup.string().min(1).max(255),
      lord_size: yup.number().oneOf([LANDLORD_SIZE_LARGE, LANDLORD_SIZE_MID, LANDLORD_SIZE_SMALL]),
      preferred_services: yup.array().of(yup.number().oneOf(CONNECT_SERVICE_INDEX, MATCH_SERVICE_INDEX)).nullable(),
      onboarding_step: yup.number().positive()
    })
}

module.exports = UpdateUser
