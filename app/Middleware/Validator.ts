import { promises as fsPromises } from 'node:fs'
import * as path from 'node:path'

// use default config from Base
import { Base } from '../Validators/Base'
import { wrapValidationError } from '../Libs/utils'

const { ValidationException } = use('Validator')

function isFunction (obj: any): obj is Function {
  return typeof obj === 'function'
}

// load all validation schemas from the subfolders 'Validators' and store a map
// to run them when needed
const loadSchemaClasses = async (): Promise<any> => {
  const validators = await fsPromises.readdir(path.join(__dirname, '../Validators/'))

  // load all validator files from the subfolder
  const schemaClasses = (
    await Promise.all(
      validators.map(
        async (validator: string) => await import(path.join(__dirname, '../Validators/', validator))
      )
    )
  ).reduce((n: any, ClassName: Function | object) => {
    // read class type validators
    if (isFunction(ClassName)) {
      return { ...n, [ClassName.name]: ClassName }
    } else {
      // read object type validators
      return { ...n, ...ClassName }
    }
  }, {})
  return schemaClasses
}

/**
 * Validate and sanitize request data
 */
class SanitizeYup {
  #schemaClassesPromise = loadSchemaClasses()

  /**
   * Run a single validation for a given schemaName and data object
   */
  private async validateSingleSchema (schemaName: string, data: object): Promise<{}> {
    let result = {}
    const schemaClasses = await this.#schemaClassesPromise
    try {
      const Schema = schemaClasses[schemaName]
      if (Schema !== undefined) {
        result = await Schema.schema().validate(data, Schema?.options ?? Base.options)
      } else {
        throw new ValidationException([{ field: 'schema', message: 'Invalid Schema name' }])
      }
    } catch (e) {
      throw wrapValidationError(e)
    }
    return result
  }

  /**
   * Handle incoming request and validate according to the reqested validators
   */
  async handle ({ request }: any, next: () => any, schemas: string[]): Promise<void> {
    const params = Object.keys(request.params)

    // save all validated params into the further request processing
    const setParams = (allResults: object): void => {
      const { values, queryParams } = Object.keys(allResults).reduce(
        (n: { queryParams: object, values: object }, k: string) =>
          params.includes(k)
            ? { queryParams: { ...n.queryParams, [k]: allResults[k] }, values: n.values }
            : { values: { ...n.values, [k]: allResults[k] }, queryParams: n.queryParams },
        {
          values: {},
          queryParams: {}
        }
      )
      request.params = queryParams
      request._all = { ...queryParams, ...values }
    }

    const requestData = { ...request.all(), ...request.params }
    const result = (
      await Promise.all(
        schemas.map(
          async (schemaName: string) => await this.validateSingleSchema(schemaName, requestData)
        )
      )
    ).reduce((n, v) => ({ ...n, ...v }))

    setParams(result)

    await next()
  }
}

module.exports = SanitizeYup
