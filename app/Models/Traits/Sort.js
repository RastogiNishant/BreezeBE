'use strict'

const { isObject, each } = require('lodash')

class Sort {
  register(Model, columns) {
    Model.queryMacro('sort', function (sortColumns = {}) {
      if (!isObject(sortColumns)) {
        throw new Error('invalid sorting data type')
      }

      each(sortColumns, (v, k) => {
        if (columns.includes(k)) {
          this.orderBy(k, v)
        }
      })
      return this
    })
  }
}

module.exports = Sort
