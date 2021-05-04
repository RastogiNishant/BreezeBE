'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class AcceptTerms extends Base {
  static schema = () =>
    yup.object().shape({
      id: id.required(),
      type: yup.string().oneOf(['agreement', 'terms']).required(),
    })
}

module.exports = AcceptTerms
