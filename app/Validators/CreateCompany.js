'use strict'

const { reduce } = require('lodash')

const Base = require('./Base')
const UpdateCompany = require('./UpdateCompany')

class CreateCompany extends Base {
  static schema = () => {
    const schema = UpdateCompany.schema().clone()
    const required = ['address', 'name']
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

module.exports = CreateCompany
