'use strict'

const yup = require('yup')
const Base = require('./Base.js')
const { id } = require('../Libs/schemas.js')

class NotifyProspectsToFillUpProfile extends Base {
  static schema = () =>
    yup.object().shape({
      emails: yup.array().of(yup.string().email()).required('emails are required')
    })
}

module.exports = NotifyProspectsToFillUpProfile
