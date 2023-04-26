'use strict'

const yup = require('yup')
const Base = require('./Base')
const { THIRD_PARTY_PUBLISHERS } = require('../constants')

class AddEstateSyncTarget extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup.string().oneOf(THIRD_PARTY_PUBLISHERS).required('type is required'),
      credentials: yup
        .object()
        .shape({
          host: yup.string().required('credentials.host is required'),
          username: yup.string().required('credentials.username is required'),
          password: yup.string().required('credentials.password is required'),
        })
        .nullable(),
    })
}

module.exports = AddEstateSyncTarget
