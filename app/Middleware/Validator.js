'use strict'

const { reduce, get } = require('lodash')
const fs = require('fs')
const path = require('path')

const { ValidationException } = use('Validator')

const { wrapValidationError } = require('../Libs/utils.js')

// Load classes
const schemaClasses = reduce(
  fs.readdirSync(path.join(__dirname, '../Validators/')),
  (n, file) => {
    const ClassName = require(path.join(__dirname, '../Validators/', file))
    return { ...n, [ClassName.name]: ClassName }
  },
  {}
)

/**
 * Validate and sanitize request data
 */
class SanitizeYup {
  async handle({ request }, next, [schemaName]) {
    const params = Object.keys(request.params)
    const setParams = (allResults) => {
      const { values, queryParams } = reduce(
        allResults,
        (n, v, k) =>
          params.includes(k)
            ? { queryParams: { ...n.queryParams, [k]: v }, values: n.values }
            : { values: { ...n.values, [k]: v }, queryParams: n.queryParams },
        {
          values: {},
          queryParams: {},
        }
      )
      request.params = queryParams
      request._all = { ...queryParams, ...values }
    }

    let result = {}
    try {
      const Schema = get(schemaClasses, schemaName)
      if (Schema) {
        result = await Schema.schema().validate(
          { ...request.all(), ...request.params },
          Schema.options
        )
      } else {
        throw new ValidationException([{ field: 'schema', message: 'Invalid Schema name' }])
      }
    } catch (e) {
      throw wrapValidationError(e)
    }

    setParams(result)

    await next()
  }
}

module.exports = SanitizeYup
