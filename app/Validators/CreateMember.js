'use strict'

const yup = require('yup')
const Base = require('./Base')

const { GENDER_ANY, GENDER_FEMALE, GENDER_MALE } = require('../constants')

class CreateMember extends Base {
  static schema = () => {
    return yup.object().shape({
      firstname: yup.string().max(254),
      secondname: yup.string().max(254),
      child: yup.boolean().default(false),
      sex: yup.number().positive().oneOf([GENDER_ANY, GENDER_FEMALE, GENDER_MALE]),
      phone: yup.string().max(30),
      birthday: yup.date(),
    })
  }
}

module.exports = CreateMember
