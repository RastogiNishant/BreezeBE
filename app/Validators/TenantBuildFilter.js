'use strict'

const yup = require('yup')
class TenantBuildFilter {
  static schema = () =>
    yup.object().shape({
      is_social: yup.boolean(),
    })
}

module.exports = TenantBuildFilter
