'use strict'

const yup = require('yup')

class ConfirmEmail {
  static schema = () =>
    yup.object().shape({
      user_id: yup.number().positive().required(),
      code: yup
        .string()
        .trim()
        .matches(/^\d{4}$/)
        .required(),
    })
}

module.exports = ConfirmEmail
