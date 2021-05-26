'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class RemoveMemberDocs extends Base {
  static schema = () =>
    yup.object().shape({
      id: id.required(),
      field: yup.string().oneOf(['rent_arrears_doc', 'debt_proof']),
    })
}

module.exports = RemoveMemberDocs
