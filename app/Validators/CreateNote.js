'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class CreateNote extends Base {
  static schema = () =>
    yup.object().shape({
      note: yup.string().required(),
      tenant_id : id.required()
    })
}

module.exports = CreateNote
