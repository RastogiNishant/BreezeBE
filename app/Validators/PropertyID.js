'use strict'

const yup = require('yup')
const Base = require('./Base')

class PropertyId extends Base {
  static schema = () =>
    yup.object().shape({
      property_id: yup.string().max(20),
      estate_id: yup.string().nullable(),
    })
}

module.exports = PropertyId
