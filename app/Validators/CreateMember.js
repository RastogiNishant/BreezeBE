'use strict'

const yup = require('yup')
const Base = require('./Base')
const { phoneSchema } = require('../Libs/schemas.js')

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

  NO_CLEAN_PROCEDURE,
  YES_CLEAN_PROCEDURE,
  NO_ANSWER_CLEAN_PROCEDURE,

  NO_INCOME_SEIZURE,
  YES_INCOME_SEIZURE,
  NO_ANSWER_INCOME_SEIZURE,
  GENDER_NEUTRAL,
  MARITAL_SINGLE,
  MARITAL_MARRIED,
  MARITAL_PERMANENT_SEPRATED,
  MARITAL_DIVORCED,
  MARITAL_WIDOWED,
  MARITAL_COHABITATION,
  MARITAL_REGISTERED_COHABITATION,
  CREDIT_HISTORY_STATUS_ENFORCEABLE_CLAIMS,
  CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA,
  CREDIT_HISTORY_STATUS_SOME_NEGATIVE_DATA
} = require('../constants')

class CreateMember extends Base {
  static schema = () => {
    return yup.object().shape({
      firstname: yup.string().max(254),
      secondname: yup.string().max(254),
      child: yup.boolean().default(false),
      sex: yup.number().positive().oneOf([GENDER_ANY, GENDER_FEMALE, GENDER_NEUTRAL, GENDER_MALE]),
      phone: phoneSchema.nullable(),
      bio: yup.string().max(100).nullable(),
      birthday: yup.date(),
      email: yup.string().email().lowercase().max('255'),
      landlord_name: yup.string().max('255').nullable(),
      landlord_phone: yup.string().max('60'),
      landlord_email: yup.string().email().lowercase().max('255'),
      last_address: yup.string().max('255'),
      credit_score_submit_later: yup.boolean(),
      credit_history_status: yup
        .number()
        .oneOf([
          CREDIT_HISTORY_STATUS_NO_NEGATIVE_DATA,
          CREDIT_HISTORY_STATUS_SOME_NEGATIVE_DATA,
          CREDIT_HISTORY_STATUS_ENFORCEABLE_CLAIMS,
          null
        ])
        .nullable(),
      credit_score_issued_at: yup.date().nullable(),
      unpaid_rental: yup
        .number()
        .oneOf([NO_UNPAID_RENTAL, YES_UNPAID_RENTAL, NO_ANSWER_UNPAID_RENTAL]),
      insolvency_proceed: yup.number().oneOf([NO_INSOLVENCY, YES_INSOLVENCY, NO_ANSWER_INSOLVENCY]),
      clean_procedure: yup
        .number()
        .oneOf([NO_CLEAN_PROCEDURE, YES_CLEAN_PROCEDURE, NO_ANSWER_CLEAN_PROCEDURE]),
      income_seizure: yup
        .number()
        .oneOf([NO_INCOME_SEIZURE, YES_INCOME_SEIZURE, NO_ANSWER_INCOME_SEIZURE]),
      execution: yup.number().positive().oneOf([1, 2, 3]),
      external_duties: yup.array().of(yup.number().oneOf([1, 2, 3])),
      duties_amount: yup.number().min(0).max(1000000),
      birth_place: yup.string().max('255'),
      rent_arrears_doc_submit_later: yup.boolean(),
      rent_proof_not_applicable: yup.boolean(),
      credit_score_not_applicable: yup.boolean(),
      marital_status: yup
        .number()
        .oneOf([
          MARITAL_SINGLE,
          MARITAL_MARRIED,
          MARITAL_PERMANENT_SEPRATED,
          MARITAL_DIVORCED,
          MARITAL_WIDOWED,
          MARITAL_COHABITATION,
          MARITAL_REGISTERED_COHABITATION
        ])
        .nullable(),
      citizen: yup.string().nullable()
    })
  }
}

// debt_proof
// rent_arrears_doc
// passport

module.exports = CreateMember
