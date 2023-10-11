'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class ExportExcel extends Base {
  static schema = () =>
    yup.object().shape({
      exclude_online: yup.boolean()
    })
}

module.exports = ExportExcel
