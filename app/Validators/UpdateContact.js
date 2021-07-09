'use strict'

const yup = require('yup')

const Base = require('./Base')

class UpdateContact extends Base {
  static schema = () => {
    return yup.object().shape({
      email: yup.string().email().lowercase().max(255),
      full_name: yup.string().min(2).max(255),
      phone: yup
        .string()
        .transform((v) => {
          return String(v).replace(/[^\d]/gi, '')
        })
        .min(7)
        .max(255),
      region: yup.string().max(255),
    })
  }
}

module.exports = UpdateContact
