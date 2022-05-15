'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateAdmin extends Base {
  static schema = () => {
    yup.object().shape({
      email: yup.string().email().lowercase().required(),
      password: yup.string().required(),
      fullname: yup.string(),
    })
  }
}

module.exports = CreateAdmin
