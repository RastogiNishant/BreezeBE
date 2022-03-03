'use strict'

const yup = require('yup')
const {
    TENANT_EMAIL_INVITE,
    TENANT_SMS_INVITE,
  } = require('../constants')

const Base = require('./Base')


class InviteTo extends Base {
  static schema = () =>
    yup.object().shape({
      invite_to: yup
      .number()
      .positive()
      .oneOf([TENANT_EMAIL_INVITE, TENANT_SMS_INVITE])
      .required(),
    })
}

module.exports = InviteTo
