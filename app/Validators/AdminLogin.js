'use strict'
const yup = require('yup')
const Base = require('./Base')

class AdminLogin extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email('Email must be valid.').required('Email is required.'),
      password: yup.string().required('Password is required.'),
    })
}

module.exports = AdminLogin
