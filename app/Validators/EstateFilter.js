'use strict'

const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

const { STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE } = require('../constants')

class EstateFilter extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().min(2),
      filter: yup.array().of(yup.number()).nullable(),
      status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(yup.number().oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE]))
            .min(1)
        } else {
          return yup.number().oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE])
        }
      }),
    })
}

module.exports = EstateFilter
