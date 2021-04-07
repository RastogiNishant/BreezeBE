'use strict'

const yup = require('yup')
const Base = require('./Base')

class PublishEstate extends Base {
  static schema = () =>
    yup.object().shape({
      action: yup.string().oneOf(['publish', 'unpublish']).required(),
    })
}

module.exports = PublishEstate
