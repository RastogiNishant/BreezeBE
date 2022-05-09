'use strict'

const yup = require('yup')

class UpdateUserValidationStatus {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['activate', 'deactivate']),
      ids: yup.array().of(yup.number().integer()),
    })
}

module.exports = UpdateUserValidationStatus
