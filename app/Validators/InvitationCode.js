'use strict'

const yup = require('yup')
const Base = require('./Base')

class InvitationCode extends Base {
  static schema = () =>
    yup.object().shape({
      code: yup
        .string().min(3).max(10).required()
    })
}

module.exports = InvitationCode
