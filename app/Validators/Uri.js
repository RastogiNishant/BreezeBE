'use strict'
const yup = require('yup')
const Base = require('./Base')

class Uri extends Base {
  static schema = () =>
    yup.object().shape({
      uri: yup.string().required(),
    })
}

module.exports = Uri
