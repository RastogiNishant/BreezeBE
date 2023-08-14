'use strict'
const Base = require('./Base')
const yup = require('yup')

class CreateTenantCertificate extends Base {
  static schema = () => {
    return yup.object().shape({
      city_id: yup.number().positive().required(),
      income_level: yup.string().max(100).required(),
      expired_at: yup.date().required(),
      file: yup.mixed(),
    })
  }
}

module.exports = CreateTenantCertificate
