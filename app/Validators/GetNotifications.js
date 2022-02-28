'use strict'

const yup = require('yup')

const Base = require('./Base')

class GetNotifications extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: yup.number(),
      date_from: yup.date(),
      date_to: yup.date(),
    })
}

module.exports = GetNotifications
