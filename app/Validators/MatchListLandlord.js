'use strict'

const yup = require('yup')
const { reduce } = require('lodash')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  INCOME_TYPE_EMPLOYEE,
  INCOME_TYPE_WORKER,
  INCOME_TYPE_UNEMPLOYED,
  INCOME_TYPE_CIVIL_SERVANT,
  INCOME_TYPE_FREELANCER,
  INCOME_TYPE_HOUSE_WORK,
  INCOME_TYPE_PENSIONER,
  INCOME_TYPE_SELF_EMPLOYED,
  INCOME_TYPE_TRAINEE,
} = require('../constants')

class MatchListLandlord extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      budget_min: yup.number().positive().max(100),
      budget_max: yup.number().positive().max(100),
      credit_score_min: yup.number().positive().max(100),
      credit_score_max: yup.number().positive().max(100),
      income_type: yup
        .array()
        .of(
          yup
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
            ])
        ),
      phone_verified: yup.boolean(),
      id_verified: yup.boolean(),
      filters: yup.lazy((value) => {
        const itemsCount = reduce(value, (n, v, k) => (v ? n.concat(k) : n), []).length
        if (itemsCount > 1) {
          return yup.number().typeError('Should be selected ony one filter item')
        }

        return yup.object().shape({
          knock: yup.boolean(),
          buddy: yup.boolean(),
          invite: yup.boolean(),
          visit: yup.boolean(),
          top: yup.boolean(),
          commit: yup.boolean(),
        })
      }),
    })
}

module.exports = MatchListLandlord
