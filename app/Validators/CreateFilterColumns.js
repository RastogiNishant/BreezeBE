'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  STATUS_ACTIVE,
  STATUS_DELETE,
  FILTER_NAME_CONNECT,
  FILTER_NAME_ESTATE,
  FILTER_NAME_MATCH,
} = require('../constants')
const FilterName = require('./FilterName')
class CreateFilterColumns extends Base {
  static schema = () =>
    yup.object().shape({
      tableName: yup.string().required(),
      tableAlias: yup.string(),
      fieldName: yup.string().required(),
      status: yup.number().integer().positive().oneOf([STATUS_ACTIVE, STATUS_DELETE]),
      order: yup.number().positive(),
    }).concat(FilterName.schema())
}

module.exports = CreateFilterColumns
