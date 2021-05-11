'use strict'

const { reduce } = require('lodash')

const Base = require('./Base')
const UpdateSlot = require('./UpdateSlot')

class CreateSlot extends Base {
  static schema = () => {
    const schema = UpdateSlot.schema().clone()
    schema.fields = reduce(schema.fields, (n, v, k) => ({ ...n, [k]: v.required() }), {})

    return schema
  }
}

module.exports = CreateSlot
