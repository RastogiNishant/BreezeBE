'use strict'

const yup = require('yup')
const Base = require('./Base')

class FilterColumnsPreferences extends Base {
  static schema = () =>
    yup.object().shape({
      filter_columns_id: yup.string().required(),
      visible: yup.boolean().required(),
      order: yup.number().positive()
    })
}

module.exports = FilterColumnsPreferences