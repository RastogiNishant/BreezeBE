'use strict'

const yup = require('yup')

const Base = require('./Base')

const {PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED} = require('../constants')

class EstatePermission extends Base {
  static schema = () =>
    yup.object().shape({
      ids: yup.array().of(yup.number().integer().positive()).required(),
      status: yup.number().oneOf([PROPERTY_MANAGE_REQUEST, PROPERTY_MANAGE_ALLOWED]).required(),
    })
}

module.exports = EstatePermission
