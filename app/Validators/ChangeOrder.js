'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class ChangeOrder extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      position: yup.number().integer().min(0).max(100000),
    })
}

module.exports = ChangeOrder
