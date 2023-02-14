'use strict'

const yup = require('yup')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  FILE_TYPE_PLAN,
  FILE_TYPE_DOC,
  FILE_TYPE_UNASSIGNED,
  FILE_TYPE_EXTERNAL,
  FILE_TYPE_CUSTOM,
  FILE_TYPE_ENERGY_CERTIFICATE,
} = require('../constants')

class EstateAddFile extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      type: yup
        .string()
        .oneOf([
          FILE_TYPE_PLAN,
          FILE_TYPE_DOC,
          FILE_TYPE_ENERGY_CERTIFICATE,
          FILE_TYPE_EXTERNAL,
          FILE_TYPE_UNASSIGNED,
          FILE_TYPE_CUSTOM,
        ])
        .required(),
    })
}

module.exports = EstateAddFile
