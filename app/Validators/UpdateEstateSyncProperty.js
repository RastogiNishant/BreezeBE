'use strict'
const yup = require('yup')
const Base = require('./Base')

class UpdateEstateSyncProperty extends Base {
  static schema = () =>
    yup.object().shape({
      estateId: yup.number().integer().positive().required(),
      title: yup.string(),
      description: yup.string()
    })
}

module.exports = UpdateEstateSyncProperty
