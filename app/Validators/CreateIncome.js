'use strict'

const yup = require('yup')
const Base = require('./Base')

const {
  HIRING_TYPE_FULL_TIME,
  HIRING_TYPE_PART_TIME,
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
  INCOME_CONTRACT_DURATION_UNLIMITED,
  INCOME_CONTRACT_DURATION_LIMITED,
  INCOME_TYPE_OTHER_BENEFIT,
  INCOME_TYPE_CHILD_BENEFIT
} = require('../constants')
const { phoneSchema } = require('../Libs/schemas.js')
class CreateIncome extends Base {
  static schema = () => {
    return yup.object().shape({
      company: yup.string().max(255),
      profession: yup.string().max(120),
      position: yup.string().max(120),
      hiring_date: yup.date().nullable(),
      work_exp: yup.number().integer().min(0).max(100),
      employment_type: yup.string().oneOf([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
      employment_working_type: yup.string().oneOf([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
      income_type: yup
        .string()
        .oneOf([
          INCOME_TYPE_EMPLOYEE,
          INCOME_TYPE_WORKER,
          INCOME_TYPE_UNEMPLOYED,
          INCOME_TYPE_CIVIL_SERVANT,
          INCOME_TYPE_FREELANCER,
          INCOME_TYPE_HOUSE_WORK,
          INCOME_TYPE_PENSIONER,
          INCOME_TYPE_SELF_EMPLOYED,
          INCOME_TYPE_TRAINEE,
          INCOME_TYPE_OTHER_BENEFIT,
          INCOME_TYPE_CHILD_BENEFIT
        ]),
      income: yup.number().min(0).required(),
      income_contract_end: yup
        .number()
        .integer()
        .oneOf([INCOME_CONTRACT_DURATION_UNLIMITED, INCOME_CONTRACT_DURATION_LIMITED]),
      is_earlier_employeed: yup.boolean().nullable(),
      employeed_address: yup.string().nullable(),
      employeer_phone_number: phoneSchema.nullable(),
      probation_period: yup.date().nullable()
    })
  }
}

module.exports = CreateIncome
