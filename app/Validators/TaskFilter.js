'use strict'

const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

const {
  TASK_STATUS_NEW_LABEL,
  TASK_STATUS_INPROGRESS_LABEL,
  TASK_STATUS_UNRESOLVED_LABEL,
  TASK_STATUS_RESOLVED_LABEL,
  TASK_STATUS_CLOSED_LABEL,
  URGENCY_LOW_LABEL,
  URGENCY_NORMAL_LABEL,
  URGENCY_HIGH_LABEL,
  URGENCY_SUPER_LABEL,
  FILTER_CONSTRAINTS_MATCH_MODES,
} = require('../constants')

class TaskFilter extends Base {
  static schema = () =>
    yup.object().shape({
      status: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
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
          matchMode: yup.string().nullable(),
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
        
      tenant_id: yup
        .object()
        .shape({
          matchMode: yup.string().nullable(),
          value: yup.array().of(yup.number().positive()).nullable(),
        })
        .nullable(),

      city: yup
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
    })
}

module.exports = TaskFilter
