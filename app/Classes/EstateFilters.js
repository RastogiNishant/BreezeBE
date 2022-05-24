const { toLower } = require('lodash')
const Database = use('Database')
class EstateFilters {
  possibleStringParams = ['address', 'area', 'property_id', 'net_rent']
  constructor(params, query) {
    console.log({ params })
    this.possibleStringParams.forEach((param) => {
      if (params[param]) {
        if (params[param].operator && params[param].constraints.length > 0) {
          query.andWhere(function () {
            if (toLower(params[param].operator) === 'or') {
              params[param].constraints.map((constraint) => {
                this.orWhere(
                  Database.raw(
                    EstateFilters.parseMatchMode(param, constraint.value, constraint.matchMode)
                  )
                )
              })
            } else if (toLower(params[param].operator) === 'and') {
              params[param].constraints.map((constraint) => {
                this.andWhere(
                  Database.raw(
                    EstateFilters.parseMatchMode(param, constraint.value, constraint.matchMode)
                  )
                )
              })
            }
          })
        }
      }
    })
    this.query = query
  }

  static parseMatchMode(param, value, matchMode) {
    switch (matchMode) {
      case 'startsWith':
        return `${param} like '${value}%'`
      case 'contains':
        return `${param} like '%${value}%'`
      case 'notContains':
        return `${param} not like '%${value}%'`
      case 'endsWith':
        return `${param} like '%${value}'`
      case 'equals':
        return `${param} = '${value}'`
      case 'notEquals':
        return `${param} <> '${value}'`
      case 'lessThan':
        return `${param} < '${value}'`
      case 'lesserThanOrEqualTo':
        return `${param} <= '${value}'`
      case 'greaterThan':
        return `${param} > '${value}'`
      case 'greaterThanOrEqualTo':
        return `${param} >= '${value}'`
    }
  }

  process() {
    return this.query
  }
}

module.exports = EstateFilters
