'use strict'

const {
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
  STATUS_ACTIVE,
  STATUS_EMAIL_VERIFY,
  STATUS_DRAFT,
  STATUS_EXPIRE,
  STATUS_OFFLINE_ACTIVE
} = require('../constants')
const { isArray } = require('lodash')
const yup = require('yup')
const Base = require('./Base')

class AdminGetsLandlords extends Base {
  static schema = () =>
    yup.object().shape({
      estate_status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(
              yup
                .number()
                .oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
            )
        } else {
          return yup
            .number()
            .oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_EXPIRE, STATUS_OFFLINE_ACTIVE])
        }
      }),
      status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(yup.number().oneOf([STATUS_ACTIVE, STATUS_EMAIL_VERIFY, STATUS_DRAFT]))
        } else {
          return yup.number().oneOf([STATUS_ACTIVE, STATUS_EMAIL_VERIFY, STATUS_DRAFT])
        }
      }),
      activation_status: yup.lazy((value) => {
        if (isArray(value)) {
          return yup
            .array()
            .of(
              yup
                .number()
                .oneOf([
                  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
                  USER_ACTIVATION_STATUS_ACTIVATED,
                  USER_ACTIVATION_STATUS_DEACTIVATED
                ])
            )
        } else {
          return yup
            .number()
            .oneOf([
              USER_ACTIVATION_STATUS_NOT_ACTIVATED,
              USER_ACTIVATION_STATUS_ACTIVATED,
              USER_ACTIVATION_STATUS_DEACTIVATED
            ])
        }
      }),
      query: yup.string(),
      today: yup.boolean()
    })
}

module.exports = AdminGetsLandlords
