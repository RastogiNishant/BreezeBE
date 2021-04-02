'use strict'

const yup = require('yup')

const { phoneSchema } = require('../Libs/schemas.js')
const { GENDER_MALE, GENDER_FEMALE, GENDER_ANY } = require('../constants')

class UpdateUser {
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
    })
}

module.exports = UpdateUser
