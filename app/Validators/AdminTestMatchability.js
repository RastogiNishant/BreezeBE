'use strict'

const yup = require('yup')
const Base = require('./Base')

class AdminTestMatchability extends Base {
  static schema = () =>
    yup.object().shape({
      estate_ids: yup.array().of(yup.number().integer().positive()),
      include_location: yup.boolean().default(false)
    })
}

module.exports = AdminTestMatchability
