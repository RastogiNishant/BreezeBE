const { toLower, isArray, isNull } = require('lodash')
const HttpException = require('../Exceptions/HttpException')
const Database = use('Database')

class Filter {
  params
  query = null
  paramToField = null
  MappingInfo = null
  TableInfo = null
  globalSearchFields = []

  constructor(params, query) {
    this.params = params
    this.query = query
  }

  /**
   * to use processGlobals, set this.globalSearchFields on the child class
   */
  processGlobals() {
    if (this.params.global && this.params.global.value) {
      const globalSearchFields = this.globalSearchFields
      const value = this.params.global.value
      this.query.where(function () {
        globalSearchFields.map((field) => {
          this.orWhere(Database.raw(`${field} ilike '%${value}%'`))
        })
      })
    }
  }

  matchFilter = (possibleStringParams, params) => {
    possibleStringParams.forEach((param) => {
      if (params[param]) {
        if (params[param].operator && params[param].constraints.length > 0) {
          this.query.andWhere(function () {
            if (toLower(params[param].operator) === 'or') {
              params[param].constraints.map((constraint) => {
                if (!isNull(constraint.value)) {
                  this.orWhere(
                    Database.raw(
                      Filter.parseMatchMode(
                        Filter.mapParamToField(param),
                        constraint.value,
                        constraint.matchMode
                      )
                    )
                  )
                }
              })
            } else if (toLower(params[param].operator) === 'and') {
              params[param].constraints.map((constraint) => {
                if (!isNull(constraint.value)) {
                  this.andWhere(
                    Database.raw(
                      Filter.parseMatchMode(
                        Filter.mapParamToField(param),
                        constraint.value,
                        constraint.matchMode
                      )
                    )
                  )
                }
              })
            }
          })
        }
        if (params[param].matchMode && params[param].matchMode === 'in') {
          if (!isNull(params[param].value)) {
            this.query.whereIn(Filter.getField(param), this.getValues(param, params[param].value))
          }
        }
      }
    })
  }

  getValues = (param, values) => {
    if (!isArray(values)) values = [values]

    const types = values.map((v) => typeof v).filter((v) => v != 'number')

    if (!types || !types.length) {
      return values
    }

    if (Filter.MappingInfo && Filter.MappingInfo[param]) {
      const mappingVals = values.map(
        (v) => Filter.MappingInfo[param][toLower(v.replace(/ /g, ''))] || null
      )
      if (mappingVals.includes(null)) {
        throw new HttpException(`No matching value for params ${param} value ${values}`, 500)
      }
      return mappingVals
    }
  }

  static getField(param) {
    return Filter.TableInfo && Filter.TableInfo[param]
      ? `${Filter.TableInfo[param]}.${param}`
      : param
  }
  static parseMatchMode(param, value, matchMode) {
    const field = this.getField(param)
    switch (matchMode) {
      case 'startsWith':
        return `${param} ilike '${value}%'`
      case 'contains':
        return `${param} ilike '%${value}%'`
      case 'notContains':
        return `${param} not ilike '%${value}%'`
      case 'endsWith':
        return `${param} ilike '%${value}'`
      case 'equals':
        return `${param} = '${value}'`
      case 'notEquals':
        return `${param} <> '${value}'`
      case 'lt':
        return `${param} < '${value}'`
      case 'lte':
        return `${param} <= '${value}'`
      case 'gt':
        return `${param} > '${value}'`
      case 'gte':
        return `${param} >= '${value}'`
    }
    return false
  }
  /**
   * map param to database field
   *
   * @memberof EstateFilters
   */
  static mapParamToField(param) {
    return (this.paramToField && this.paramToField[param]) || param
  }

  process() {
    return this.query
  }
}

module.exports = Filter
