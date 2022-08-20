'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class LastId extends Base {
  static schema = () =>
    yup.object().shape({
      lastId: yup
        .number()
        .transform((v) => (v === '' || Number.isNaN(v) ? null : v))
        .nullable(),
    })
}

module.exports = LastId
