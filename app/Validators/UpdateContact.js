'use strict'

const yup = require('yup')

const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      full_name: yup.string().min(2).max(255),
      phone: phoneSchema,
      region: yup.string().max(255),
      avatar: yup.string().max(255),
    })
  }
}

module.exports = UpdateContact
