'use strict'

const { camelCase, isArray, isEmpty } = require('lodash')

const ModelFilter = use('ModelFilter')

class BaseModelFilter extends ModelFilter {
  constructor(builder, ...props) {
    super(builder, ...props)

    builder.Model.columns.forEach((i) => {
      if (this[i]) {
        return false
      }

      this[camelCase(i)] = (value) => {
        if (isArray(value)) {
          if (isEmpty(value)) {
            return false
          }
          return this.whereIn(i, value)
        }

        return this.where(i, value)
      }
    })
  }

  static get dropId() {
    return false
  }
}

module.exports = BaseModelFilter
