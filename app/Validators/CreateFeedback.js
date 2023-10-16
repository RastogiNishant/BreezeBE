'use strict'
const yup = require('yup')
const Base = require('./Base')

class CreateFeedback extends Base {
  static schema = () =>
    yup.object().shape({
      description: yup.string().min(1).max(1024).nullable(),
      point: yup.number().integer().min(0).max(5).required(),
      device: yup.string().max(255).required()
    })
}

module.exports = CreateFeedback
