'use strict'

const yup = require('yup')
const Base = require('./Base')

const { phoneSchema } = require('../Libs/schemas.js')
const {
  GENDER_MALE,
  GENDER_FEMALE,
  GENDER_ANY,
  ROLE_USER,
  ROLE_LANDLORD,
  LANDLORD_SIZE_LARGE,
  LANDLORD_SIZE_MID,
  LANDLORD_SIZE_SMALL,
  TRANSPORT_TYPE_CAR,
  TRANSPORT_TYPE_WALK,
  TRANSPORT_TYPE_SOCIAL,
  ROLE_PROPERTY_MANAGER,
} = require('../constants')

const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, MINLENGTH, MAXLENGTH, OPTION, DATE, BOOLEAN, EMAIL, MATCH },
} = require('../excepions')

class SignUp extends Base {
  static schema = () =>
    yup.object().shape({
      email: yup
        .string()
        .email(getExceptionMessage('email', EMAIL))
        .lowercase()
        .required(getExceptionMessage('email', REQUIRED)),
      role: yup
        .number()
        .oneOf(
          [ROLE_USER, ROLE_LANDLORD, ROLE_PROPERTY_MANAGER],
          getExceptionMessage(
            'role',
            OPTION,
            `[${ROLE_USER},${ROLE_LANDLORD},${ROLE_PROPERTY_MANAGER}]`
          )
        )
        .required(getExceptionMessage('role', REQUIRED)),
      signupData: yup
        .object()
        .shape({
          address: yup.object().shape({
            title: yup.string(),
            coord: yup
              .string()
              .matches(
                /^(-)?\d{1,3}\.\d{5,8}\,(-)?\d{1,3}\.\d{5,8}$/,
                getExceptionMessage('address', MATCH)
              ),
          }),
          transport: yup
            .string()
            .oneOf(
              [TRANSPORT_TYPE_CAR, TRANSPORT_TYPE_WALK, TRANSPORT_TYPE_SOCIAL],
              getExceptionMessage(
                'transport',
                OPTION,
                `[${TRANSPORT_TYPE_CAR},${TRANSPORT_TYPE_WALK},${TRANSPORT_TYPE_SOCIAL}]`
              )
            ),
          time: yup
            .number()
            .integer()
            .oneOf([15, 30, 45, 60], getExceptionMessage('time', OPTION, `[15, 30, 45, 60]`)),
        })
        .nullable(),
      password: yup
        .string()
        .trim()
        .min(6, getExceptionMessage('password', MINLENGTH, 6))
        .max(36, getExceptionMessage('password', MAXLENGTH, 36))
        .required(getExceptionMessage('password', REQUIRED)),
      sex: yup
        .number()
        .oneOf(
          [GENDER_MALE, GENDER_FEMALE, GENDER_ANY],
          getExceptionMessage('sex', OPTION, `[${GENDER_MALE},${GENDER_FEMALE},${GENDER_ANY}]`)
        )
        .required(getExceptionMessage('sex', REQUIRED)),
      phone: phoneSchema,
      firstname: yup
        .string()
        .min(2, getExceptionMessage('firstname', MINLENGTH, 2))
        .max(254, getExceptionMessage('firstname', MAXLENGTH, 254)),
      secondname: yup
        .string()
        .min(2, getExceptionMessage('secondname', MINLENGTH, 2))
        .max(254, getExceptionMessage('secondname', MAXLENGTH, 254)),
      birthday: yup
        .date()
        .typeError(getExceptionMessage('birthday', DATE))
        .required(getExceptionMessage('birthday', REQUIRED)),
      lang: yup
        .string()
        .oneOf(['en', 'de'], getExceptionMessage('lang', OPTION, '[en,de]'))
        .default('en'),
      lord_size: yup
        .number()
        .oneOf(
          [LANDLORD_SIZE_LARGE, LANDLORD_SIZE_MID, LANDLORD_SIZE_SMALL],
          getExceptionMessage(
            'lord_size',
            OPTION,
            `[${LANDLORD_SIZE_LARGE},${LANDLORD_SIZE_MID},${LANDLORD_SIZE_SMALL}]`
          )
        ),
      request_full_profile: yup
        .boolean()
        .typeError(getExceptionMessage('request_full_profile', BOOLEAN)),
      landlord_email: yup.string().email(getExceptionMessage('landlord_email', EMAIL)).lowercase(),
      landlord_confirm_email: yup
        .string()
        .email(getExceptionMessage('landlord_confirm_email', EMAIL))
        .lowercase(),
      from_web: yup.boolean().typeError(getExceptionMessage('from_web', BOOLEAN)),
      data1: yup.string(),
      data2: yup.string(),
    })
}

module.exports = SignUp
