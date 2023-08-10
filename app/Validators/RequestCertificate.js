'use strict'
const yup = require('yup')
const Base = require('./Base')

class RequestCertificate extends Base {
  static schema = () => {
    return yup.object().shape({
      request_certificate_at: yup.date().required(),
      request_certificate_city_id: yup.string().max(10).required(),
    })
  }
}

module.exports = RequestCertificate
