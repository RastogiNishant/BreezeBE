'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class DeleteIncome extends Base {
  static schema = () =>
    yup.object().shape({
      id: id.required(),
      income_id: id.required(),
    })
}

module.exports = DeleteIncome
