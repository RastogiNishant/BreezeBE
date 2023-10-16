'use strict'

const yup = require('yup')
const Base = require('./Base')

class Key extends Base {
  static schema = () =>
    yup.object().shape({
      key: yup.string()
    })
}

module.exports = Key
