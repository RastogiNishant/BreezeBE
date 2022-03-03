'use strict'

const yup = require('yup')
const Base = require('./Base')

class TenantProperty extends Base {
  static schema = () =>
    yup.object().shape({
      properties: yup.string().required(),
      prices: yup.number().positive().required(),
    })
}

module.exports = TenantProperty