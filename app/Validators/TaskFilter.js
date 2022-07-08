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
        .array()
        .of(
          yup.object().shape({
            id: id,
            inside_breeze: yup.boolean().required(),
          })
        )
        .nullable(),
      only_inside_breeze: yup.boolean(),
      only_outside_breeze: yup.boolean(),
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
