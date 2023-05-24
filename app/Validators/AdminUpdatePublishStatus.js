'use strict'
const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_PUBLISHERS } = require('../constants')

class AdminUpdatePublishStatus extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['unpublish', 'publish', 'publish-marketplace']),
      publishers: yup.array().of(yup.string().oneOf(THIRD_PARTY_PUBLISHERS)),
      ids: yup.array().when('action', {
        is: 'unpublish',
        then: yup
          .array()
          .of(yup.number().integer().positive())
          .required('missing field: ids')
          .typeError('ids must be an array of integers'),
      }),
      id: yup
        .number()
        .integer()
        .when('action', {
          is: (action) => action === 'publish' || action === 'publish-marketplace',
          then: yup.number().integer().required('id is required'),
        }),
    })
}

module.exports = AdminUpdatePublishStatus
