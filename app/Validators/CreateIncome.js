'use strict'

const yup = require('yup')
const Base = require('./Base')

const {
  HIRING_TYPE_FULL_TIME,
  HIRING_TYPE_PART_TIME,
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_PENSION,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_STUDENT_TRAINEE,
  INCOME_TYPE_PRIVATE,
} = require('../constants')

class CreateIncome extends Base {
  static schema = () => {
    return yup.object().shape({
      company: yup.string().max(255),
      profession: yup.string().max(120),
      position: yup.string().max(120),
      hiring_date: yup.date(),
      work_exp: yup.number().integer().min(0).max(100),
      employment_type: yup.string().oneOf([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
      income_type: yup
        .string()
        .oneOf([
          INCOME_TYPE_EMPLOYEE,
          INCOME_TYPE_UNEMPLOYED,
          INCOME_TYPE_PENSION,
          INCOME_TYPE_SELF_EMPLOYED,
          INCOME_TYPE_STUDENT_TRAINEE,
          INCOME_TYPE_PRIVATE,
        ]),
      income: yup.number().min(0),
    })
  }
}

module.exports = CreateIncome
