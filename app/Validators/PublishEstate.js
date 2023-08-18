'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  THIRD_PARTY_PUBLISHERS,
  PUBLISH_PROPERTY,
  UNPUBLISH_PROPERTY,
  DEACTIVATE_PROPERTY,
  PUBLISH_OFFLINE_PROPERTY,
} = require('../constants')

class PublishEstate extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup
        .string()
        .oneOf([
          PUBLISH_PROPERTY,
          UNPUBLISH_PROPERTY,
          DEACTIVATE_PROPERTY,
          PUBLISH_OFFLINE_PROPERTY,
        ])
        .required(),
      publishers: yup.array().of(yup.string().oneOf(THIRD_PARTY_PUBLISHERS)).nullable(),
      estate_ids: yup.array().of(yup.number().positive()).nullable(),
    })
}

module.exports = PublishEstate
