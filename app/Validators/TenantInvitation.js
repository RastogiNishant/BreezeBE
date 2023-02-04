'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  exceptionKeys: { MATCH, MAXLENGTH },
  getExceptionMessage,
} = require('../exceptions')
const { phoneSchema } = require('../Libs/schemas.js')

class TenantInvitation extends Base {
  static schema = () =>
    yup.object().shape({
      invites: yup.array().of(
        yup.object().shape({
          estate_id: id,
          address: yup.string().when('estate_id', (estate_id, schema) => {
            return estate_id ? schema : yup.string().required()
          }),
          coord: yup
            .string()
            .matches(
              /^(-)?\d{1,3}\.\d{5,8}\,(-)?\d{1,3}\.\d{5,8}$/,
              getExceptionMessage('address', MATCH)
            )
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().required()
            }),
          surname: yup.string().required(),
          email: yup.string().email().max(255, getExceptionMessage('email', MAXLENGTH, 255)),
          phone: phoneSchema.nullable(),
        })
      ),
    })
}

module.exports = TenantInvitation
