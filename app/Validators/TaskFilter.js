'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

const {
  TASK_STATUS_NEW_LABEL,
  TASK_STATUS_INPROGRESS_LABEL,
  TASK_STATUS_UNRESOLVED_LABEL,
  TASK_STATUS_RESOLVED_LABEL,
  TASK_STATUS_CLOSED_LABEL,

  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_CLOSED,

  URGENCY_LOW_LABEL,
  URGENCY_NORMAL_LABEL,
  URGENCY_HIGH_LABEL,
  URGENCY_SUPER_LABEL,

  IS_INSIDE_BREEZE,
  IS_OUTSIDE_BREEZE,

  FILTER_CONSTRAINTS_MATCH_MODES,
  FILTER_CONSTRAINTS_DATE_MATCH_MODES,
  FILTER_CONSTRAINTS_COUNT_MATCH_MODES,
} = require('../constants')

class TaskFilter extends Base {
  static schema = () =>
    yup.object().shape({
      global: yup
        .object()
        .shape({
          matchMode: yup.string().required(),
          value: yup.string().nullable(),
        })
        .nullable(),
      status: yup
        .object()
        .shape({
          matchMode: yup.string(),
          value: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([
                  TASK_STATUS_NEW_LABEL,
                  TASK_STATUS_INPROGRESS_LABEL,
                  TASK_STATUS_UNRESOLVED_LABEL,
                  TASK_STATUS_RESOLVED_LABEL,
                  TASK_STATUS_CLOSED_LABEL,
                ])
            )
            .nullable(),
        })
        .nullable(),
      urgency: yup
        .object()
        .shape({
          matchMode: yup.string().required(),
          value: yup
            .array()
            .of(
              yup
                .string()
                .oneOf([
                  URGENCY_LOW_LABEL,
                  URGENCY_NORMAL_LABEL,
                  URGENCY_HIGH_LABEL,
                  URGENCY_SUPER_LABEL,
                ])
            )
            .nullable(),
        })
        .nullable(),
      property_id: yup
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
      active_task: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_COUNT_MATCH_MODES).required(),
              value: yup.number().min(0).nullable(),
            })
          ),
        })
        .nullable(),
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
      breeze_type: yup
        .object()
        .shape({
          matchMode: yup.string().required(),
          value: yup.boolean().nullable(),
        })
        .nullable(),
      city: yup
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
      address: yup
        .object()
        .shape({
          operator: yup.string().oneOf(['and', 'or']),
          constraints: yup.array().of(
            yup.object().shape({
              matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES),
              value: yup.string().nullable(),
            })
          ),
        })
        .nullable(),
      phone_number: yup.object().shape({
        operator: yup.string().oneOf(['and', 'or']),
        constraints: yup.array().of(
          yup.object().shape({
            matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES).required(),
            value: yup.string().nullable(),
          })
        ),
      }),
      email: yup.object().shape({
        operator: yup.string().oneOf(['and', 'or']),
        constraints: yup.array().of(
          yup.object().shape({
            matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_MATCH_MODES).required(),
            value: yup.string().nullable(),
          })
        ),
      }),
      contract_end: yup.object().shape({
        operator: yup.string().oneOf(['and', 'or']),
        constraints: yup.array().of(
          yup.object().shape({
            matchMode: yup.string().oneOf(FILTER_CONSTRAINTS_DATE_MATCH_MODES).required(),
            value: yup.date().typeError('please enter a valid date').nullable(),
          })
        ),
      }),

      archived_status: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              TASK_STATUS_NEW,
              TASK_STATUS_INPROGRESS,
              TASK_STATUS_RESOLVED,
              TASK_STATUS_UNRESOLVED,
              TASK_STATUS_CLOSED,
            ])
        )
        .nullable(),
    })
}

module.exports = TaskFilter
