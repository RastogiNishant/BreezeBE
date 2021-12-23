'use strict'

const yup = require('yup')
const { reduce } = require('lodash')

const Base = require('./Base')

class MatchStageCountTenant extends Base {
  static schema = () =>
    yup.object().shape({
      filter: yup.lazy((value) => {
        const itemsCount = reduce(value, (n, v, k) => (v ? n.concat(k) : n), []).length
        if (itemsCount > 1) {
          return yup.number().typeError('Should be selected only one filter item')
        }

        return yup.object().shape({
          decide: yup.boolean(),
          visit: yup.boolean(),
        })
      }),
    })
}

module.exports = MatchStageCountTenant
