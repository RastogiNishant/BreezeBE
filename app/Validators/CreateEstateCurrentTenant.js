'use strict'
const Base = require('./Base')
const yup = require('yup')
const {} = require('../constants')

class CreateEstateCurrentTenant extends Base {
  static schema = () => yup.object().shape({})
}

module.exports = CreateEstateCurrentTenant
