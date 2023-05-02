'use strict'

const yup = require('yup')
const Base = require('./Base')

class InitializeEstateSync extends Base {
  static schema = () =>
    yup.object().shape({
      contact: yup
        .object()
        .shape({
          email: yup.string().email().required(),
          title: yup.string(),
          firstName: yup.string(),
          lastName: yup.string().required(),
          mobilePhone: yup.string(),
          phone: yup.string(),
          website: yup.string(),
        })
        .required(),
      is24key: yup.string().required('is24key is required.').typeError('is24key is required.'),
      is24secret: yup
        .string()
        .required('is24secret is required.')
        .typeError('is24key is required.'),
    })
}

module.exports = InitializeEstateSync
