'use strict'

const { reduce, get } = require('lodash')
const Promise = require('bluebird')
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
  /**
   *
   */
  async validateSingleSchema(schemaName, data) {
    let result = {}
    try {
      const Schema = get(schemaClasses, schemaName)
      if (Schema) {
        result = await Schema.schema().validate(data, Schema.options)
      } else {
        throw new ValidationException([{ field: 'schema', message: 'Invalid Schema name' }])
      }
    } catch (e) {
      throw wrapValidationError(e)
    }
    return result
  }

  /**
   *
   */
  async handle({ request }, next, schemas) {
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

    const requestData = { ...request.all(), ...request.params }
    const result = (
      await Promise.map(schemas, (schemaName) => this.validateSingleSchema(schemaName, requestData))
    ).reduce((n, v) => ({ ...n, ...v }))

    setParams(result)

    await next()
  }
}

module.exports = SanitizeYup
