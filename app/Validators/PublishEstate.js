'use strict'

const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_PUBLISHERS } = require('../constants')

class PublishEstate extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['publish', 'unpublish']).required(),
      publishers: yup.array().of(yup.string().oneOf(THIRD_PARTY_PUBLISHERS)),
    })
}

module.exports = PublishEstate
