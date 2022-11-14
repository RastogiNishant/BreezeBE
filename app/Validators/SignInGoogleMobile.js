'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, NUMBER, BOOLEAN, EMAIL, MATCH },
} = require('../exceptions')

class SignInGoogleMobile extends Base {
  static schema = () =>
    yup.object().shape({
      role: yup
        .number()
        .oneOf(
          [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER],
          getExceptionMessage(
            'role',
            OPTION,
            `[${ROLE_USER}, ${ROLE_LANDLORD}, ${ROLE_PROPERTY_MANAGER}]`
          )
        )
        .required(),
      token: yup
        .string()
        .min(30, getExceptionMessage('token', MINLENGTH, 30))
        .max(1600, getExceptionMessage('token', MAXLENGTH, 1600))
        .required(getExceptionMessage('token', REQUIRED)),
      device_token: yup
        .string()
        .min(30, getExceptionMessage('device_token', MINLENGTH, 30))
        .max(255, getExceptionMessage('device_token', MAXLENGTH, 255)),
      owner_id: yup.number().typeError(getExceptionMessage('owner_id', NUMBER)).positive(),
      member_id: yup.number().typeError(getExceptionMessage('member_id', NUMBER)).positive(),
      code: yup.string(),
      data1: yup.string(),
      data2: yup.string(),
    })
}

module.exports = SignInGoogleMobile
