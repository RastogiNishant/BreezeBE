'use strict'

const yup = require('yup')

const Base = require('./Base')
class InvitationIds extends Base {
  static schema = () =>
    yup.object().shape({
      ids: yup
        .array()
        .of(yup.number().integer().positive())
        .max(50, 'only can invite up to 50')
        .required(),
    })
}

module.exports = InvitationIds
