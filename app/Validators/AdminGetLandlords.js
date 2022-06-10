'use strict'

const {
  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
  USER_ACTIVATION_STATUS_ACTIVATED,
  USER_ACTIVATION_STATUS_DEACTIVATED,
} = require('../constants')
const { isArray } = require('lodash')
const yup = require('yup')
const Base = require('./Base')

class AdminGetLandlords extends Base {
  static schema = () =>
    yup.object().shape({
      activation_status: yup.lazy((value) => {
        console.log({ value })
        if (isArray(value)) {
          return yup
            .array()
            .of(
              yup
                .number()
                .oneOf([
                  USER_ACTIVATION_STATUS_NOT_ACTIVATED,
                  USER_ACTIVATION_STATUS_ACTIVATED,
                  USER_ACTIVATION_STATUS_DEACTIVATED,
                ])
            )
        } else {
          return yup
            .number()
            .oneOf([
              USER_ACTIVATION_STATUS_NOT_ACTIVATED,
              USER_ACTIVATION_STATUS_ACTIVATED,
              USER_ACTIVATION_STATUS_DEACTIVATED,
            ])
        }
      }),
    })
}

module.exports = AdminGetLandlords
