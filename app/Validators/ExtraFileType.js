'use strict'

const yup = require('yup')
const Base = require('./Base')

const { id } = require('../Libs/schemas.js')
const {
  MEMBER_FILE_TYPE_EXTRA_DEBT,
  MEMBER_FILE_TYPE_EXTRA_RENT,
  MEMBER_FILE_PASSPORT_DOC,
  MEMBER_FILE_EXTRA_PASSPORT_DOC,
} = require('../constants')

class ExtraFileType extends Base {
  static schema = () =>
    yup.object().shape({
      file_type: yup
        .string()
        .oneOf([
          MEMBER_FILE_TYPE_EXTRA_DEBT,
          MEMBER_FILE_TYPE_EXTRA_RENT,
          MEMBER_FILE_PASSPORT_DOC,
          MEMBER_FILE_EXTRA_PASSPORT_DOC,
        ])
        .required(),
    })
}

module.exports = ExtraFileType
