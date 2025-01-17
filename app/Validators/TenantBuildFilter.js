'use strict'

const yup = require('yup')
class TenantBuildFilter {
  static schema = () =>
    yup.object().shape({
      is_social: yup.boolean(),
      include_geography: yup.boolean()
    })
}

module.exports = TenantBuildFilter
