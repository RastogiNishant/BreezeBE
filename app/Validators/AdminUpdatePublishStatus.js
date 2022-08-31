'use strict'
const yup = require('yup')
const Base = require('./Base')

class AdminUpdatePublishStatus extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['unpublish']),
      ids: yup
        .array()
        .of(yup.number().integer().positive())
        .required('missing field: ids')
        .typeError('ids must be an array of integers'),
    })
}

module.exports = AdminUpdatePublishStatus
