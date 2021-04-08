'use strict'

const yup = require('yup')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const { FILE_TYPE_COVER, FILE_TYPE_PLAN, FILE_TYPE_DOC } = require('../constants')

class EstateAddFile extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      type: yup.string().oneOf([FILE_TYPE_COVER, FILE_TYPE_PLAN, FILE_TYPE_DOC]).required(),
    })
}

module.exports = EstateAddFile
