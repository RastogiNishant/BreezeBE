'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER } = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, INVALID, NUMBER },
} = require('../excepions')

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
      ip: yup
        .string()
        .min(7, MINLENGTH)
        .max(45, MAXLENGTH)
        .matches(/^[0-9a-f:.]+$/, getExceptionMessage('Ip Address', INVALID)),
      ip_based_info: yup.object().shape({
        country_code: yup.string(),
        country_name: yup.string(),
        city: yup.string().nullable(),
        postal: yup.string().nullable(),
        latitude: yup.string().nullable(),
        longitude: yup.string().nullable(),
      }),
    })
}

module.exports = SignInGoogleMobile
