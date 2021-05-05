'use strict'

const yup = require('yup')
const Base = require('./Base')

const { HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME } = require('../constants')

class CreateMember extends Base {
  static schema = () =>
    yup.object().shape({
      firstname: yup.string().max(255),
      secondname: yup.string().max(255),
      child: yup.boolean().default(false),
      phone: yup.string().max(30),
      profession: yup.string().max(60),
      hiring_date: yup.date(),
      employment_type: yup.string().oneOf([HIRING_TYPE_FULL_TIME, HIRING_TYPE_PART_TIME]),
      major_income: yup.number().positive(),
      extra_income: yup.number().min(0),
    })
}

module.exports = CreateMember
