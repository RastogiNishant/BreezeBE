'use strict'

const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_PUBLISHERS } = require('../constants')

class PublishEstate extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['publish', 'unpublish']).required(),
      from_web: yup.string().oneOf(['1']),
      publishers: yup.array().when('from_web', {
        is: '1',
        then: yup.array().of(yup.string().oneOf(THIRD_PARTY_PUBLISHERS)),
      }),
      confirm_incomplete: yup.boolean().default(false),
    })
}

module.exports = PublishEstate
