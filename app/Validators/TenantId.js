'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class TenantId extends Base {
  static schema = () =>
    yup.object().shape({
      tenant_id: id.required(),
    })
}

module.exports = TenantId
