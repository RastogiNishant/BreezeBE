'use strict'

const yup = require('yup')
const Base = require('./Base')

const {} = require('../constants')

const MAX_PG_INT = 2147483647

class TenantEstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      exclude_from: yup.number().integer().min(0).max(MAX_PG_INT).nullable(),
      exclude_to: yup.number().integer().min(0).max(MAX_PG_INT).nullable(),
      exclude: yup
        .array()
        .of(
          yup.mixed().test('isValid', 'Invalid Exclude', function (value) {
            const regex = /^[a-z]+\-[0-9]+$/
            return Number.isInteger(+value) || regex.test(value)
          })
        )
        .nullable(),
      limit: yup.number().integer().min(0).max(500),
    })
}

module.exports = TenantEstateFilter
