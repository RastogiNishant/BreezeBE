'use strict'

const yup = require('yup')
const Base = require('./Base')

class ChangePassword extends Base {
  static schema = () =>
    yup.object().shape({
      current_password: yup.string().trim().min(6).max(36).required(),
      new_password: yup.string().trim().min(6).max(36).required(),
    })
}

module.exports = ChangePassword
