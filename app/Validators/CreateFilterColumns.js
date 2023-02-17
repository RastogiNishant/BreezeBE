'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  STATUS_ACTIVE,
  STATUS_DELETE,
} = require('../constants')
const FilterName = require('./FilterName')
class CreateFilterColumns extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string().required(),
      tableName: yup.string().required(),
      tableAlias: yup.string(),
      fieldName: yup.string().required(),
      status: yup.number().integer().positive().oneOf([STATUS_ACTIVE, STATUS_DELETE]),
      order: yup.number().positive(),
      default_visible: yup.boolean(),
      used_global_search: yup.boolean(),
      is_used_filter: yup.boolean(),
    }).concat(FilterName.schema())
}

module.exports = CreateFilterColumns
