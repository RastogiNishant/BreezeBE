'use strict'

const yup = require('yup')
const Base = require('./Base')

class IncomeId extends Base {
  static schema = () =>
    yup.object().shape({
      id: yup.string().min(5, 'Must be 5 digits'),
    })
}

module.exports = IncomeId
