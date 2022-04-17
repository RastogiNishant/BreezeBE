'use strict'

const yup = require('yup')
const Base = require('./Base')

class EstateMultipleDelete extends Base {
  static schema = () =>
    yup.object().shape({
      id: yup.array().of(yup.number().integer().positive()).required(),
    })
}

module.exports = EstateMultipleDelete
