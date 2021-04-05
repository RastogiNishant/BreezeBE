'use strict'

const yup = require('yup')

class ChangePassword {
  static schema = () =>
    yup.object().shape({
      current_password: yup.string().trim().min(6).max(36).required(),
      new_password: yup.string().trim().min(6).max(36).required(),
    })
}

module.exports = ChangePassword
