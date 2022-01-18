'use strict'

const yup = require('yup')

const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const { GENDER_MALE, GENDER_FEMALE, GENDER_ANY, IS_PUBLIC, IS_PRIVATE } = require('../constants')

class UpdateUser extends Base {
  static schema = () =>
    yup.object().shape({
      password: yup.string().trim().min(6).max(36),
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
    })
}

module.exports = UpdateUser
