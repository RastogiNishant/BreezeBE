'use strict'

const yup = require('yup')
const Base = require('./Base')

class EstateIds extends Base {
  static schema = () =>
    yup.object().shape({
      estate_ids: yup
        .array()
        .of(yup.number().integer().positive())
        .required('Estate IDs are required')
    })
}

module.exports = EstateIds
