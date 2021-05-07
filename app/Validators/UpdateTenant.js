'use strict'

const yup = require('yup')
const Base = require('./Base')

class UpdateTenant extends Base {
  static schema = () =>
    yup.object().shape({
    })
}

module.exports = UpdateTenant
