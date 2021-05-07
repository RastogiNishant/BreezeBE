'use strict'

const yup = require('yup')
const Base = require('./Base')

const { id } = require('../Libs/schemas.js')
const {
  MEMBER_FILE_TYPE_RENT,
  MEMBER_FILE_TYPE_DEBT,
  MEMBER_FILE_TYPE_INCOME,
} = require('../constants')

class GetProtectedFiles extends Base {
  static schema = () =>
    yup.object().shape({
      user_id: id.required(),
      file_id: id,
      member_id: id.required(),
      file_type: yup
        .string()
        .oneOf([MEMBER_FILE_TYPE_RENT, MEMBER_FILE_TYPE_DEBT, MEMBER_FILE_TYPE_INCOME]),
    })
}

module.exports = GetProtectedFiles
