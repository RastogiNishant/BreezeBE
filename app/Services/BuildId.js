'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class BuildId extends Base {
  static schema = () =>
    yup.object().shape({
      build_id: id.required()
    })
}

module.exports = BuildId
