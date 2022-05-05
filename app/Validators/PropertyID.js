'use strict'

const yup = require('yup')
const Base = require('./Base')

class PropertyId extends Base {
  static schema = () =>
    yup.object().shape({
      property_id: yup.string().max(20),
      estate_id: yup.number().positive().nullable().typeError('estate_id must be an integer.'),
    })
}

module.exports = PropertyId
