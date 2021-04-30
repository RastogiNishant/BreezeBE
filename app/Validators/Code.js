'use strict'

const yup = require('yup')
const Base = require('./Base')

class Code extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup
        .string()
        .matches(/^[\da-f]{3,10}$/i, 'Should be hex up 3 to 10 length')
        .lowercase()
        .required(),
    })
}

module.exports = Code
