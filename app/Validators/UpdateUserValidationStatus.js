'use strict'

const yup = require('yup')

class UpdateUserValidationStatus {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['activate', 'deactivate', 'deactivate-in-2-days']),
      ids: yup.array().of(yup.number().integer()).required(),
    })
}

module.exports = UpdateUserValidationStatus
