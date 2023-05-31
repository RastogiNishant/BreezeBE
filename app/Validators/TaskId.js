'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')
const { TASK_COMMON_TYPE, TASK_SYSTEM_TYPE } = require('../constants.js')

class TaskId extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.number().oneOf([TASK_COMMON_TYPE, TASK_SYSTEM_TYPE]).nullable(),
      task_id: yup.number().when(['type'], {
        is: (type) => {
          return type === TASK_COMMON_TYPE
        },
        then: id.required(),
        otherwise: yup.number().nullable(),
      }),
      estate_id: yup.number().when(['type'], {
        is: (type) => {
          return type === TASK_SYSTEM_TYPE
        },
        then: id.required(),
        otherwise: yup.number().nullable(),
      }),
    })
}

module.exports = TaskId
