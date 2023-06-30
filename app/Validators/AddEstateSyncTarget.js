'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  THIRD_PARTY_PUBLISHERS,
  ESTATE_SYNC_PUBLISH_PROVIDER_EBAY,
  ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT,
} = require('../constants')

class AddEstateSyncTarget extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.string().oneOf(THIRD_PARTY_PUBLISHERS).required('type is required'),
      credentials: yup.object().when('type', {
        is: (type) => {
          return (
            type === ESTATE_SYNC_PUBLISH_PROVIDER_EBAY ||
            type === ESTATE_SYNC_PUBLISH_PROVIDER_IMMOWELT
          )
        },
        then: yup
          .object()
          .shape({
            host: yup.string().required('host is required.'),
            username: yup.string().required('username is required.'),
            password: yup.string().required('password is required.'),
          })
          .required('credentials is required'),
        otherwise: yup.object().nullable(),
      }),
    })
}

module.exports = AddEstateSyncTarget
