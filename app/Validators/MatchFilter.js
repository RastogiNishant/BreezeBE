const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')
const {
  LOW_MATCH_ICON,
  MEDIUM_MATCH_ICON,
  SUPER_MATCH_ICON,
  MATCH_HOUSEHOLD_HAS_CHILD_LABEL,
  MATCH_HOUSEHOLD_NO_CHILD_LABEL,
  INCOME_TYPE_EMPLOYEE_LABEL,
  INCOME_TYPE_WORKER_LABEL,
  INCOME_TYPE_UNEMPLOYED_LABEL,
  INCOME_TYPE_CIVIL_SERVANT_LABEL,
  INCOME_TYPE_FREELANCER_LABEL,
  INCOME_TYPE_HOUSE_WORK_LABEL,
  INCOME_TYPE_PENSIONER_LABEL,
  INCOME_TYPE_SELF_EMPLOYED_LABEL,
  INCOME_TYPE_TRAINEE_LABEL,
  DOC_INCOME_PROOF_LABEL,
  DOC_RENT_ARREARS_LABEL,
  DOC_CREDIT_SCORE_LABEL,

  FILTER_CONSTRAINTS_MATCH_MODES,
  FILTER_CONSTRAINTS_DATE_MATCH_MODES,
  FILTER_CONSTRAINTS_COUNT_MATCH_MODES,
  MATCH_STATUS_KNOCK,
  MATCH_STATUS_INVITE,
  MATCH_STATUS_VISIT,
  MATCH_STATUS_SHARE,
  MATCH_STATUS_COMMIT,
  MATCH_STATUS_FINISH,
  MATCH_STATUS_TOP,
} = require('../constants')
const { id } = require('../Libs/schemas.js')

class MatchFilter extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      tenant: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES).required(),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      match_status: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              MATCH_STATUS_KNOCK,
              MATCH_STATUS_INVITE,
              MATCH_STATUS_VISIT,
              MATCH_STATUS_SHARE,
              MATCH_STATUS_TOP,
              MATCH_STATUS_COMMIT,
              MATCH_STATUS_FINISH,
            ])
        )
        .required(),
      percent: yup
        .object()
        .shape({
          matchMode: yup.string(),
          value: yup
            .array()
            .of(yup.string().oneOf([LOW_MATCH_ICON, MEDIUM_MATCH_ICON, SUPER_MATCH_ICON]))
            .nullable(),
        })
        .nullable(),
      has_child: yup
        .object()
        .shape({
          matchMode: yup.string(),
          value: yup
            .array()
            .of(
              yup.string().oneOf([MATCH_HOUSEHOLD_HAS_CHILD_LABEL, MATCH_HOUSEHOLD_NO_CHILD_LABEL])
            )
            .nullable(),
        })
        .nullable(),
      age: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.number().positive().nullable(),
            })
          ),
        })
        .nullable(),
      income: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.number().nullable(),
            })
          ),
        })
        .nullable(),
      income_sources: yup
        .object()
        .shape({
          matchMode: yup.string(),
          value: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([
                  INCOME_TYPE_EMPLOYEE_LABEL,
                  INCOME_TYPE_WORKER_LABEL,
                  INCOME_TYPE_UNEMPLOYED_LABEL,
                  INCOME_TYPE_CIVIL_SERVANT_LABEL,
                  INCOME_TYPE_FREELANCER_LABEL,
                  INCOME_TYPE_HOUSE_WORK_LABEL,
                  INCOME_TYPE_PENSIONER_LABEL,
                  INCOME_TYPE_SELF_EMPLOYED_LABEL,
                  INCOME_TYPE_TRAINEE_LABEL,
                ])
            )
            .nullable(),
        })
        .nullable(),
      duration: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.number().nullable(),
            })
          ),
        })
        .nullable(),
      doc_type: yup
        .object()
        .shape({
          matchMode: yup.string(),
          value: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([DOC_INCOME_PROOF_LABEL, DOC_RENT_ARREARS_LABEL, DOC_CREDIT_SCORE_LABEL])
            )
            .nullable(),
        })
        .nullable(),
      status: yup.object().shape({
        operator: yup.string().oneOf(['and', 'or']),
        constraints: yup.array().of(
          yup.object().shape({
            matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_DATE_MATCH_MODES).required(),
            value: yup.date().typeError('please enter a valid date').nullable(),
          })
        ),
      }),
    })
}

module.exports = MatchFilter
