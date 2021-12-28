'use strict'

const yup = require('yup')
const Base = require('./Base')

class PropertyId extends Base {
  static schema = () =>
    yup.object().shape({
      id: yup.string().min(5, 'Must be 5 digits'),
    })
}

module.exports = PropertyId
