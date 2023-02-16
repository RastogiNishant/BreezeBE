'use strict'

const yup = require('yup')
const { INCOME_NORMAL_TYPE, INCOME_EXTRA_TYPE } = require('../constants')
const Base = require('./Base')

class AddIncomeProof extends Base {
  static schema = () =>
    yup.object().shape({
      expire_date: yup.date(),
      type: yup.string().oneOf([INCOME_NORMAL_TYPE, INCOME_EXTRA_TYPE]).nullable(),
    })
}

module.exports = AddIncomeProof
