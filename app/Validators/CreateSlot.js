'use strict'

const { reduce } = require('lodash')
const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { OPTION },
} = require('../exceptions')

const Base = require('./Base')
const UpdateSlot = require('./UpdateSlot')

class CreateSlot extends Base {
  static schema = () => {
    const schema = UpdateSlot.schema().clone()
    schema.fields = reduce(schema.fields, (n, v, k) => ({ ...n, [k]: v.required() }), {})
    schema.fields.slot_length = yup
      .number()
      .oneOf([5, 10, 15, null], getExceptionMessage('slot_length', OPTION, '[5, 10, 15, null]'))
      .nullable(true)
      .notRequired()

    return schema
  }
}

module.exports = CreateSlot
