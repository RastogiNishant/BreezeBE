'use strict'

const yup = require('yup')
const Base = require('./Base.js')

class NotifyProspectsToFillUpProfile extends Base {
  static schema = () =>
    yup.object().shape({
      emails: yup
        .array()
        .of(yup.string().email('email must be valid'))
        .required('emails are required'),
      estate_id: yup.number().integer().positive().required('estate id is required.')
    })
}

module.exports = NotifyProspectsToFillUpProfile
