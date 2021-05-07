'use strict'

const yup = require('yup')
const Base = require('./Base')

class AddIncomeProof extends Base {
  static schema = () =>
    yup.object().shape({
      expire_date: yup.date(),
    })
}

module.exports = AddIncomeProof
