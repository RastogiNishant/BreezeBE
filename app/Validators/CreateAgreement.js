'use strict'

const yup = require('yup')
const Base = require('./Base')

const { STATUS_ACTIVE, STATUS_DELETE, STATUS_DRAFT } = require('../constants')

class CreateAgreement extends Base {
  static schema = () =>
    yup.object().shape({
      status: yup.number().integer().oneOf([STATUS_ACTIVE, STATUS_DELETE, STATUS_DRAFT]),
      body: yup.string().min(10).max(50000),
      body_de: yup.string().min(10).max(50000),
      title: yup.string().min(10).max(1000),
      title_de: yup.string().min(10).max(1000),
    })
}

module.exports = CreateAgreement
