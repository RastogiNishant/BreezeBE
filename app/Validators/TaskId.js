'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class TaskId extends Base {
  static schema = () =>
    yup.object().shape({
      task_id: id.required(),
    })
}

module.exports = TaskId
