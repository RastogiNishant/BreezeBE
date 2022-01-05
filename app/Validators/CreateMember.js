'use strict'

const yup = require('yup')
const Base = require('./Base')

const {
  GENDER_ANY,
  GENDER_FEMALE,
  GENDER_MALE,

  NO_UNPAID_RENTAL,
  YES_UNPAID_RENTAL,
  NO_ANSWER_UNPAID_RENTAL,

  NO_INSOLVENCY,
  YES_INSOLVENCY,
  NO_ANSWER_INSOLVENCY,

  NO_ARREST_WARRANTY,
  YES_ARREST_WARRANTY,
  NO_ANSWER_WARRANTY,

  NO_CLEAN_PROCEDURE,
  YES_CLEAN_PROCEDURE,
  NO_ANSWER_CLEAN_PROCEDURE,

  NO_INCOME_SEIZURE,
  YES_INCOME_SEIZURE,
  NO_ANSWER_INCOME_SEIZURE,
} = require('../constants')

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
      landlord_name: yup.string().max('255').nullable(),
      landlord_phone: yup.string().max('60'),
      landlord_email: yup.string().email().max('255'),
      last_address: yup.string().max('255'),
      credit_score: yup.number().min(0).max(100),
      unpaid_rental: yup
        .number()
        .oneOf([NO_UNPAID_RENTAL, YES_UNPAID_RENTAL, NO_ANSWER_UNPAID_RENTAL]),
      insolvency_proceed: yup.number().oneOf([NO_INSOLVENCY, YES_INSOLVENCY, NO_ANSWER_INSOLVENCY]),
      arrest_warranty: yup
        .number()
        .oneOf([NO_ARREST_WARRANTY, YES_ARREST_WARRANTY, NO_ANSWER_WARRANTY]),
      clean_procedure: yup
        .number()
        .oneOf([NO_CLEAN_PROCEDURE, YES_CLEAN_PROCEDURE, NO_ANSWER_CLEAN_PROCEDURE]),
      income_seizure: yup
        .number()
        .oneOf([NO_INCOME_SEIZURE, YES_INCOME_SEIZURE, NO_ANSWER_INCOME_SEIZURE]),

      // execution: yup.boolean(),
      external_duties: yup.array().of(yup.number().oneOf([1, 2, 3])),
      duties_amount: yup.number().min(0).max(1000000),
    })
  }
}

// debt_proof
// rent_arrears_doc

module.exports = CreateMember
