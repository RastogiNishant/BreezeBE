'use strict'

const { reduce } = require('lodash')

const Base = require('./Base')
const UpdateContact = require('./UpdateContact')

class CreateContact extends Base {
  static schema = () => {
    const schema = UpdateContact.schema().clone()
    const required = ['full_name', 'email', 'address']
    schema.fields = reduce(
      schema.fields,
      (n, v, k) => {
        return { ...n, [k]: required.includes(k) ? v.required() : v }
      },
      {}
    )

    return schema
  }
}

module.exports = CreateContact
