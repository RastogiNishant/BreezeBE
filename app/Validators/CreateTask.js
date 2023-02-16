'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  URGENCY_LOW,
  URGENCY_NORMAL,
  URGENCY_HIGH,
  URGENCY_SUPER,
  TASK_STATUS_NEW,
  TASK_STATUS_INPROGRESS,
  TASK_STATUS_UNRESOLVED,
  TASK_STATUS_RESOLVED,
} = require('../constants')
class CreateTask extends Base {
  static schema = () =>
    yup.object().shape({
      title: yup.string().max(255).required(),
      estate_id: id.required(),
      urgency: yup
        .number()
        .positive()
        .oneOf([URGENCY_LOW, URGENCY_NORMAL, URGENCY_HIGH, URGENCY_SUPER]),
      status: yup
        .number()
        .positive()
        .oneOf([
          TASK_STATUS_NEW,
          TASK_STATUS_INPROGRESS,
          TASK_STATUS_UNRESOLVED,
          TASK_STATUS_RESOLVED,
        ]),
      description: yup.string(),
      file: yup.mixed(),
    })
}

module.exports = CreateTask
