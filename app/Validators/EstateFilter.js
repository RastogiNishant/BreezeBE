'use strict'

const yup = require('yup')
const Base = require('./Base')

class EstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().min(2),
      status: yup.number().oneOf([1, 5]),
    })
}

module.exports = EstateFilter
