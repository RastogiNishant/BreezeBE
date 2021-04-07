'use strict'

const yup = require('yup')
const Base = require('./Base')

class ResetEmailConfirm extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup.string().uppercase().min(6).required(),
      password: yup.string().trim().min(6).max(36).required(),
    })
}

module.exports = ResetEmailConfirm
