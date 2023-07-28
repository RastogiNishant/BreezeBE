'use strict'

const yup = require('yup')
const Base = require('./Base')

class SearchCity extends Base {
  static schema = () =>
    yup.object().shape({
      country_code: yup.string().oneOf(['de', 'ch', 'at']),
      city: yup
        .string()
        .required()
        .matches(/^[^!@#$%^&*+=<>:;|~]*$/, 'must not have any symbols')
        .min(3),
    })
}

module.exports = SearchCity
