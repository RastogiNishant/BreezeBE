'use strict'

const yup = require('yup')
const Base = require('./Base')

class ResetEmailRequest extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
    })
}

module.exports = ResetEmailRequest