'use strict'

const { reduce, uniq, without, isArray } = require('lodash')

class FindWithOrder {
  register(Model) {
    const getOrderQuery = (data, field) => {
      return `CASE ${reduce(data, (n, v, k) => `${n} WHEN ${field} = ${v} THEN ${k}`, '')} END`
    }

    Model.queryMacro('withOrder', function (items, field = 'id') {
      const ids = without(uniq(isArray(items) ? items : [items]), null, undefined)
      if (ids.length === 0) {
        return this
      }

      if (ids.length === 1) {
        return this.where(field, ids[0]).limit(1)
      }

      return this.whereIn(field, ids).limit(ids.length).orderByRaw(getOrderQuery(ids, field))
    })
  }
}

module.exports = FindWithOrder
