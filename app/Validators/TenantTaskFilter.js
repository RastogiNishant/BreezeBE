'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
  TASK_SYSTEM_TYPE,
  TASK_COMMON_TYPE,
} = require('../constants')
class TenantTaskFilter extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id,
      status: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              TASK_STATUS_NEW,
              TASK_STATUS_INPROGRESS,
              TASK_STATUS_UNRESOLVED,
              TASK_STATUS_RESOLVED,
            ])
        ),
      type: yup.number().oneOf([TASK_SYSTEM_TYPE, TASK_COMMON_TYPE]).nullable(),
      query: yup.string().min(1).nullable(),
    })
}

module.exports = TenantTaskFilter
