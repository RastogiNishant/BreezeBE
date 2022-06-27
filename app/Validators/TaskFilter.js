'use strict'

const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

const {
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
  TASK_STATUS_CLOSED,
  URGENCY_LOW,
  URGENCY_NORMAL,
  URGENCY_HIGH,
  URGENCY_SUPER,
  FILTER_CONSTRAINTS_MATCH_MODES,
} = require('../constants')

class TaskFilter extends Base {
  static schema = () =>
    yup.object().shape({
      status: yup.lazy((value) => {
        return yup
          .array()
          .of(
            yup
              .number()
              .oneOf([
                TASK_STATUS_NEW,
                TASK_STATUS_INPROGRESS,
                TASK_STATUS_RESOLVED,
                TASK_STATUS_UNRESOLVED,
                TASK_STATUS_RESOLVED,
                TASK_STATUS_CLOSED,
              ])
          )
      }),
      urgency: yup.lazy((value) => {
        return yup
          .array()
          .of(yup.number().oneOf([URGENCY_LOW, URGENCY_NORMAL, URGENCY_HIGH, URGENCY_SUPER]))
      }),
      tenant_id: yup
        .lazy((value) => {
          return yup.array().of(yup.number().positive())
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
