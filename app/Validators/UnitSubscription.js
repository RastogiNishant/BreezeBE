'use strict'

const yup = require('yup')
const Base = require('./Base')

class UnitSubscription extends Base {
  static schema = () =>
    yup.object().shape({
      product_id: yup.string().required(),
      quantity: yup.number().positive(),
    })
}

module.exports = UnitSubscription
