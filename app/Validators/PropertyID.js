'use strict'

const yup = require('yup')
const Base = require('./Base')

class PropertyId extends Base {
  static schema = () =>
    yup.object().shape({
      property_id: yup.string().min(5, 'Must be 5 digits'),
      estate_id: yup.string().nullable(),
    })
}

module.exports = PropertyId
