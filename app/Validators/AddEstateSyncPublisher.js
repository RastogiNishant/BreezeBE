'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  THIRD_PARTY_PUBLISHERS,
  ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT,
  ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
} = require('../constants')

class AcceptTerms extends Base {
  static schema = () =>
    yup.object().shape({
      publisher: yup.string().oneOf(THIRD_PARTY_PUBLISHERS),
      host: yup.string().when('publisher', {
        is: (publisher) =>
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT ||
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
        then: yup.string().required(),
      }),
      username: yup.string().when('publisher', {
        is: (publisher) =>
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT ||
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
        then: yup.string().required(),
      }),
      password: yup.string().when('publisher', {
        is: (publisher) =>
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT ||
          publisher === ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
        then: yup.string().required(),
      }),
    })
}

module.exports = AcceptTerms
