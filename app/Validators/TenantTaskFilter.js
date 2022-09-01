'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
} = require('../constants')
class TenantTaskFilter extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
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
    })
}

module.exports = TenantTaskFilter
