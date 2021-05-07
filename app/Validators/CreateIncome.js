'use strict'

const yup = require('yup')
const Base = require('./Base')

const { HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME } = require('../constants')

class CreateIncome extends Base {
  static schema = () => {
    return yup.object().shape({
      profession: yup.string().max(120),
      position: yup.string().max(120),
      hiring_date: yup.date(),
      employment_type: yup.string().oneOf([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
      income: yup.number().min(0),
    })
  }
}

module.exports = CreateIncome
