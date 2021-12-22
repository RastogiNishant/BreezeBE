'use strict'

const yup = require('yup')
const { reduce } = require('lodash')

const Base = require('./Base')

class MatchListTenant extends Base {
  static schema = () =>
    yup.object().shape({
      filters: yup.lazy((value) => {
        const itemsCount = reduce(value, (n, v, k) => (v ? n.concat(k) : n), []).length
        if (itemsCount > 1) {
          return yup.number().typeError('Should be selected ony one filter item')
        }

        return yup.object().shape({
          like: yup.boolean(),
          dislike: yup.boolean(),
          buddy: yup.boolean(),
          knock: yup.boolean(),
          invite: yup.boolean(),
          visit: yup.boolean(),
          share: yup.boolean(),
          top: yup.boolean(),
          commit: yup.boolean(),
        })
      }),
    })
}

module.exports = MatchListTenant
