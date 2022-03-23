'use strict'

const yup = require('yup')
const Base = require('./Base')

class LandlordInviteToView extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: yup.number().integer().required(),
      emails: yup.array().of(
        yup.string().email()
      )
    })
}

module.exports = LandlordInviteToView
