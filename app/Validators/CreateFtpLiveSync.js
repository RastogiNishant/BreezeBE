'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateFtpLiveSync extends Base {
  static schema = () =>
    yup.object().shape({
      company: yup.string().required('Company is required.'),
      email: yup.string().email().required('Email is required.'),
    })
}

module.exports = CreateFtpLiveSync
