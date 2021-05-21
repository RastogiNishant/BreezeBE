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
      email: yup.string().email().max('255'),
      landlord_name: yup.string().max('255'),
      landlord_phone: yup.string().max('60'),
      landlord_email: yup.string().email().max('255'),
      last_address: yup.string().max('255'),
      credit_score: yup.number().min(0).max(100),
      unpaid_rental: yup.boolean(),
      insolvency_proceed: yup.boolean(),
      arrest_warranty: yup.boolean(),
      clean_procedure: yup.boolean(),
      income_seizure: yup.boolean(),
      execution: yup.boolean(),
      external_duties: yup.array().of(yup.number().oneOf([1, 2, 3])),
      duties_amount: yup.number().min(0).max(1000000),
    })
  }
}

// debt_proof
// rent_arrears_doc

module.exports = CreateMember
