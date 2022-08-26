const { toLower, isArray, isNull, trim } = require('lodash')
const HttpException = require('../Exceptions/HttpException')
const Database = use('Database')
const moment = require('moment')
const { DAY_FORMAT } = require('../constants')
const FilterColumnsService = use('App/Services/FilterColumnsService')

class Filter {
  params
  query = null
  paramToField = null
  MappingInfo = null
  TableInfo = {}
  globalSearchFields = []
  matchFilters = []

  user_id = null
  filterName = ''
  columns = []


  constructor(params, query, user_id, filterName = '') {
    this.params = params
    this.query = query
    this.filterName = filterName
    this.user_id = user_id
  }

  /**
   * to use processGlobals, set this.globalSearchFields on the child class
   */

  async init() {
    if (!this.user_id || !this.filterName || trim(this.filterName) === '') {
      return
    }

    this.columns = (await FilterColumnsService.getAll({ user_id: this.user_id, filter: { filterName: this.filterName } })).toJSON({ isOwner: true })
    this.globalSearchFields = (this.columns || []).filter(column => column.used_global_search && column.visible).map(column => `${column.tableAlias || column.tableName}.${column.fieldName}`)
    this.matchFilters = (this.columns || []).filter(column => !column.is_used_filter && column.visible).map(column => column.fieldName)

    this.TableInfo = (this.columns || []).reduce(
      (tableInfo, column) => {
        const fieldName = column.fieldName
        return {
          ...tableInfo,
          [fieldName]: (column.tableAlias || column.tableName)
        }
      },
      {}
    );
  }

  isExist(fieldName) {
    return this.columns.find(column => column.fieldName === fieldName && column.visible)
  }

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
      if (params[param]) {
        if (params[param].operator && params[param].constraints.length > 0) {
          this.query.having(function () {
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
    return this.TableInfo && this.TableInfo[param]
      ? `${this.TableInfo[param]}.${param}`
      : param
  }

  static parseMatchMode(param, value, matchMode) {
    const field = this.getField(param)
    if (moment.utc(value, DAY_FORMAT, true).format(DAY_FORMAT) !== 'Invalid date') {
      value = moment.utc(value, DAY_FORMAT, true).format(DAY_FORMAT)
    }

    switch (matchMode) {
      case 'startsWith':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} ilike '${value}%'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} ilike '${value}%'`
      case 'contains':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} ilike '%${value}%'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} ilike '%${value}%'`
      case 'notContains':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} not ilike '%${value}%'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} not ilike '%${value}%'`
      case 'endsWith':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} ilike '%${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} ilike '%${value}'`
      case 'equals':
      case 'dateIs':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} = '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} = '${value}'`
      case 'notEquals':
      case 'dateIsNot':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} <> '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} <> '${value}'`
      case 'lt':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} < '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} < '${value}'`
      case 'lte':
      case 'dateBefore':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} <= '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} <= '${value}'`
      case 'gt':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} > '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
        return `${field} > '${value}'`
      case 'gte':
      case 'dateAfter':
        if (isArray(field)) {
          const filterList = field.map((f) => `${this.getField(f)} >= '${value}'`)
          const filter = `( ${filterList.join(` or `)} )`
          return filter
        }
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
