'use strict'

const yup = require('yup')
const Base = require('./Base')

class GewobagWebhook extends Base {
  static schema = () =>
    yup.object().shape({
      k: yup.string().required(),
      url: yup.string().required(),
    })
}

module.exports = GewobagWebhook
