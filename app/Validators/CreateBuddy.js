'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateBuddy extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string().max(30),
      phone: yup.string(),
      email: yup.string().email().max('255'),
    })
}

module.exports = CreateBuddy
