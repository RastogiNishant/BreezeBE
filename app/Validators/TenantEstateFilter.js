'use strict'

const yup = require('yup')
const Base = require('./Base')

const {} = require('../constants')

class TenantEstateFilter extends Base {
  static schema = () =>
    yup
      .object()
      .shape({
        filters: yup.object().shape({
          likes: yup.boolean(),
        }),
      })
      .nullable()
}

module.exports = TenantEstateFilter
