'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')
const {
  exceptionKeys: { MATCH, MAXLENGTH },
  getExceptionMessage
} = require('../exceptions')
const { phoneSchema } = require('../Libs/schemas.js')
const {
  ESTATE_FLOOR_DIRECTION_NA,
  ESTATE_FLOOR_DIRECTION_LEFT,
  ESTATE_FLOOR_DIRECTION_RIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
  ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT
} = require('../constants')

class TenantInvitation extends Base {
  static schema = () =>
    yup.object().shape({
      invites: yup.array().of(
        yup.object().shape({
          estate_id: id,
          address: yup.string().when('estate_id', (estate_id, schema) => {
            return estate_id ? schema : yup.string().required()
          }),
          city: yup
            .string()
            .nullable()
            .max(40)
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().max(40).required()
            }),
          zip: yup
            .string()
            .nullable()
            .max(8)
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().max(8).required()
            }),
          street: yup
            .string()
            .nullable()
            .min(2)
            .max(255)
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().min(2).max(255).required()
            }),
          house_number: yup
            .string()
            .nullable()
            .min(1)
            .max(255)
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().min(1).max(255).required()
            }),
          country: yup
            .string()
            .nullable()
            .min(1)
            .max(255)
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().min(1).max(255).required()
            }),
          coord: yup
            .string()
            .nullable()
            .matches(
              /^(-)?\d{1,3}\.\d{5,13}\,(-)?\d{1,3}\.\d{5,13}$/,
              getExceptionMessage('coord', MATCH)
            )
            .when('estate_id', (estate_id, schema) => {
              return estate_id ? schema : yup.string().required()
            }),
          floor: yup.number().integer().min(0).max(21).nullable(), //0: ground floor, 21: root floor
          floor_direction: yup
            .number()
            .integer()
            .nullable(true)
            .oneOf([
              ESTATE_FLOOR_DIRECTION_NA,
              ESTATE_FLOOR_DIRECTION_LEFT,
              ESTATE_FLOOR_DIRECTION_RIGHT,
              ESTATE_FLOOR_DIRECTION_STRAIGHT,
              ESTATE_FLOOR_DIRECTION_STRAIGHT_LEFT,
              ESTATE_FLOOR_DIRECTION_STRAIGHT_RIGHT,
              null
            ]),
          surname: yup.string().nullable(),
          phone: phoneSchema.nullable(),
          email: yup
            .string()
            .email()
            .max(255, getExceptionMessage('email', MAXLENGTH, 255))
            .nullable()
            .when('phone', {
              is: (phone) => !phone,
              then: yup.string().required()
            })
        })
      )
    })
}

module.exports = TenantInvitation
