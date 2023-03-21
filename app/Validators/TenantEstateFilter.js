'use strict'

const yup = require('yup')
const Base = require('./Base')

const {} = require('../constants')

const MAX_PG_INT = 2147483647

class TenantEstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      exclude_from: yup
        .mixed()
        .test('isValid', 'Invalid Exclude From', function (value) {
          if (typeof value === 'undefined') {
            //nullable doesn't work here... :(
            return true
          }
          const regex = /^[a-z]+\-[0-9]+$/
          return Number.isInteger(+value) || regex.test(value)
        })
        .nullable(), //nullable doesn't work here... :(
      exclude_to: yup
        .mixed()
        .test('isValid', 'Invalid Exclude To', function (value) {
          if (typeof value === 'undefined') {
            return true
          }
          const regex = /^[a-z]+\-[0-9]+$/
          return Number.isInteger(+value) || regex.test(value)
        })
        .nullable(),
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
