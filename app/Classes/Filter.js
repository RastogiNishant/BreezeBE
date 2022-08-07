const { toLower, isArray, isNull } = require('lodash')
const HttpException = require('../Exceptions/HttpException')
const Database = use('Database')
const moment = require('moment')
const { DAY_FORMAT } = require('../constants')

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

  matchCountFilter = (possibleStringParams, params) => {
    possibleStringParams.forEach((param) => {
      if (typeof params[param] === 'number') {
        if (params[param].operator && params[param].constraints.length > 0) {
          this.query.having(function () {
            if (toLower(params[param].operator) === 'or') {
              params[param].constraints.map((constraint) => {
                if (!isNull(constraint.value)) {
                  this.orWhere(
                    Database.raw(
                      Filter.parseCountMode(
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
                      Filter.parseCountMode(
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

  static parseCountMode(param, value, matchMode) {
    switch (matchMode) {
      case 'startsWith':
        return `${param} > ${value}`
      case 'contains':
        return `${param} = ${value}`
      case 'notContains':
        return `${param} <> ${value}`
      case 'endsWith':
        return `${param} < ${value}`
      case 'equals':
        return `${param} = ${value}`
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

  static parseMatchMode(param, value, matchMode) {
    const field = this.getField(param)
    if (new Date(value).toString() !== 'Invalid Date') {
      value = moment.utc(value, 'MM/DD/YYYY').format(DAY_FORMAT)
    }

    switch (matchMode) {
      case 'startsWith':
        return `${field} ilike '${value}%'`
      case 'contains':
        return `${field} ilike '%${value}%'`
      case 'notContains':
        return `${field} not ilike '%${value}%'`
      case 'endsWith':
        return `${field} ilike '%${value}'`
      case 'equals':
        return `${field} = '${value}'`
      case 'notEquals':
        return `${field} <> '${value}'`
      case 'lt':
        return `${field} < '${value}'`
      case 'lte':
        return `${field} <= '${value}'`
      case 'gt':
        return `${field} > '${value}'`
      case 'gte':
        return `${field} >= '${value}'`
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
