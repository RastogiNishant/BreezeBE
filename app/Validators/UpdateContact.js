'use strict'

const yup = require('yup')

const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_NEUTRAL,
  GENDER_ANY,
} = require('../constants')

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      title: yup.number().oneOf([GENDER_MALE, GENDER_FEMALE, GENDER_NEUTRAL, GENDER_ANY]),
      full_name: yup.string().min(2).max(255),
      phone: phoneSchema.nullable(),
      region: yup.string().max(255),
      avatar: yup.string().max(255),
      address: yup.string().min(1).required(),
    })
  }
}

module.exports = UpdateContact
