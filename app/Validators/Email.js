'use strict'

const yup = require('yup')

const Base = require('./Base')
class Email extends Base {
  static schema = () => {
    yup.object().shape({
      email: yup.string().email().max('255').required(),
    })
  }
}

module.exports = Email