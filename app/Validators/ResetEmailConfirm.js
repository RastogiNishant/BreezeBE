'use strict'

const yup = require('yup')

class ResetEmailConfirm {
  static schema = () =>
    yup.object().shape({
      code: yup.string().uppercase().min(6).required(),
      password: yup.string().trim().min(6).max(36).required(),
    })
}

module.exports = ResetEmailConfirm
