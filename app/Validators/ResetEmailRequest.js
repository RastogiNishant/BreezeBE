'use strict'

const yup = require('yup')

class ResetEmailRequest {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
    })
}

module.exports = ResetEmailRequest
