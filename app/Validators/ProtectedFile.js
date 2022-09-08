'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  MEMBER_FILE_TYPE_PASSPORT,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  MEMBER_FILE_TYPE_INCOME,
} = require('../constants')

class ProtectedFile extends Base {
  static schema = () =>
    yup.object().shape({
      user_id: id.required(),
      file_id: id.required(),
      member_id: id.required(),
      file_type: yup
        .string()
        .oneOf([
          MEMBER_FILE_TYPE_PASSPORT,
          MEMBER_FILE_TYPE_EXTRA_RENT,
          MEMBER_FILE_TYPE_EXTRA_DEBT,
          MEMBER_FILE_TYPE_INCOME,
        ])
        .required(),
    })
}

module.exports = ProtectedFile
