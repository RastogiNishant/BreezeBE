'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')
const { STATUS_ACTIVE, STATUS_EXPIRE, STATUS_DELETE } = require('../constants')

class EstateCurrentTenantFilter extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: id,
      status: yup.array().of(yup.number().oneOf([STATUS_ACTIVE, STATUS_DELETE])),
    })
}

module.exports = EstateCurrentTenantFilter
