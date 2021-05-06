'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class IncomeId extends Base {
  static schema = () =>
    yup.object().shape({
      income_id: id.required(),
    })
}

module.exports = IncomeId
