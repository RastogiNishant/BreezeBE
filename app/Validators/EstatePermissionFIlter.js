'use strict'

const yup = require('yup')
const { isArray } = require('lodash')
const Base = require('./Base')

const { PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED } = require('../constants')

class EstatePermissionFilter extends Base {
  static schema = () =>
    yup.object().shape({
      ids: yup.array().of(yup.number().integer().positive()),
      status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(yup.number().oneOf([PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED]))
            .min(1)
        } else {
          return yup.number().oneOf([PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED])
        }
      }),
    })
}

module.exports = EstatePermissionFilter
