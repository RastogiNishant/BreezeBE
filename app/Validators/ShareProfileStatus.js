'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  LANDLORD_REQUEST_TENANT_SHARE_PROFILE_SHARED,
  LANDLORD_REQUEST_TENANT_SHARE_PROFILE_DECLINED
} = require('../constants')

class ShareProfileStatus extends Base {
  static schema = () =>
    yup.object().shape({
      estateId: yup.number().positive().required().typeError('estateId must be an integer.'),
      profileStatus: yup
        .number()
        .positive()
        .oneOf([
          LANDLORD_REQUEST_TENANT_SHARE_PROFILE_SHARED,
          LANDLORD_REQUEST_TENANT_SHARE_PROFILE_DECLINED
        ])
        .required()
    })
}

module.exports = ShareProfileStatus
