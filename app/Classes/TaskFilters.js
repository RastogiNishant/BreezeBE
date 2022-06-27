const { toLower, isArray, isEmpty, trim, isNull, includes, isBoolean } = require('lodash')

class TaskFilters {
  query = null

  constructor(params, query) {
    if (isEmpty(params)) {
      return query
    }

    // ['region', 'address']

  }
}

module.exports = TaskFilters