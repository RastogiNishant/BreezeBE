'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class MemberFileId extends Base {
  static schema = () =>
    yup.object().shape({
      member_file_id: id.required(),
    })
}

module.exports = MemberFileId
