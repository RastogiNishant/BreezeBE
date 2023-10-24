'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')
const { ROLE_LANDLORD, ROLE_USER } = require('../constants.js')

class AdminGeneratePassword extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email('Email must be valid').required('Email is required'),
      role: yup.number().oneOf([ROLE_LANDLORD, ROLE_USER]).required('Role is required'),
      password: yup.string()
    })
}

module.exports = AdminGeneratePassword
