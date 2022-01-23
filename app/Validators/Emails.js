'use strict'

const yup = require('yup')

const Base = require('./Base')
class Emails extends Base {
  static schema = () =>
    yup.object().shape({
      emails: yup.array().of(yup.string().email().max('255')).required(),
    })
}

module.exports = Emails