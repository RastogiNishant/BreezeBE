'use strict'

const yup = require('yup')

const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const _ = require('lodash')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
  IS_PUBLIC,
  IS_PRIVATE,
  LANDLORD_SIZE_SMALL,
  LANDLORD_SIZE_MID,
  LANDLORD_SIZE_LARGE,
  CONNECT_SERVICE_INDEX,
  MATCH_SERVICE_INDEX,
  COMPANY_SIZE_SMALL,
  COMPANY_SIZE_MID,
  COMPANY_SIZE_LARGE,
} = require('../constants')
const {
  getExceptionMessage,
  exceptionKeys: {
    REQUIRED,
    MINLENGTH,
    MAXLENGTH,
    OPTION,
    DATE,
    BOOLEAN,
    EMAIL,
    MATCH,
    ARRAY,
    CURRENT_PASSWORD_REQUIRED,
  },
} = require('../excepions')

class UpdateUser extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup.string().email(getExceptionMessage('email', EMAIL)),
      password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('password', MINLENGTH, 6))
        .max(36, getExceptionMessage('password', MAXLENGTH, 36))
        .when(['email'], {
          is: (email) => !_.isEmpty(email),
          then: yup.string().required(getExceptionMessage(undefined, CURRENT_PASSWORD_REQUIRED)),
        }),
      file: yup.mixed(),
      sex: yup
        .number()
        .oneOf(
          [GENDER_MALE, GENDER_FEMALE, GENDER_ANY],
          getExceptionMessage('sex', OPTION, `[${GENDER_MALE},${GENDER_FEMALE},${GENDER_ANY}]`)
        ),
      phone: phoneSchema,
      birthday: yup.date().typeError(getExceptionMessage('birthday', DATE)),
      firstname: yup
        .string()
        .min(2, getExceptionMessage('firstname', MINLENGTH, 2))
        .max(254, getExceptionMessage('firstname', MAXLENGTH, 254)),
      secondname: yup
        .string()
        .min(2, getExceptionMessage('secondname', MINLENGTH, 2))
        .max(254, getExceptionMessage('secondname', MAXLENGTH, 254)),
      lang: yup.string().oneOf(['en', 'de'], getExceptionMessage('lang', OPTION, `[en,de]`)),
      notice: yup.boolean().typeError(getExceptionMessage('notice', BOOLEAN)),
      prospect_visibility: yup
        .number()
        .oneOf(
          [IS_PRIVATE, IS_PUBLIC],
          getExceptionMessage('prospect_visibility', OPTION, `[${IS_PRIVATE},${IS_PUBLIC}]`)
        ),
      landlord_visibility: yup
        .number()
        .oneOf(
          [IS_PRIVATE, IS_PUBLIC],
          getExceptionMessage('landlord_visibility', OPTION, `[${IS_PRIVATE},${IS_PUBLIC}]`)
        ),
      company_name: yup.string().max(255, getExceptionMessage('company_name', MAXLENGTH, 255)),
      size: yup
        .string()
        .oneOf(
          [COMPANY_SIZE_SMALL, COMPANY_SIZE_MID, COMPANY_SIZE_LARGE],
          getExceptionMessage(
            'size',
            OPTION,
            `[${COMPANY_SIZE_SMALL},${COMPANY_SIZE_MID},${COMPANY_SIZE_LARGE}]`
          )
        ),
      preferred_services: yup
        .array()
        .typeError(getExceptionMessage('preferred_services', ARRAY))
        .of(
          yup.number().oneOf([CONNECT_SERVICE_INDEX, MATCH_SERVICE_INDEX]),
          getExceptionMessage(
            'preferred_services',
            OPTION,
            `[${CONNECT_SERVICE_INDEX},${MATCH_SERVICE_INDEX}]`
          )
        ),
    })
}

module.exports = UpdateUser
