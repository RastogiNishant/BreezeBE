'use strict'

const yup = require('yup')
const { reduce } = require('lodash')

const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class MatchListLandlord extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id.required(),
      filters: yup.lazy((value) => {
        const itemsCount = reduce(value, (n, v, k) => (v ? n.concat(k) : n), []).length
        if (itemsCount > 1) {
          return yup.number().typeError('Should be selected ony one filter item')
        }

        return yup.object().shape({
          knock: yup.boolean(),
          buddy: yup.boolean(),
          invite: yup.boolean(),
          visit: yup.boolean(),
          top: yup.boolean(),
          commit: yup.boolean(),
        })
      }),
    })
}

module.exports = MatchListLandlord
