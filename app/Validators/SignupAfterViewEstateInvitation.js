'use strict'

const yup = require('yup')
const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')
const {ROLE_USER} = require('../constants')

class SignupAfterViewEstateInvitation extends Base{
  static schema() {
    return yup.object().shape({
      email: yup.string().email().lowercase().required(),
      role: yup.number().oneOf([ROLE_USER]).required(),
      phone: phoneSchema
    })
  }
}

module.exports = SignupAfterViewEstateInvitation
