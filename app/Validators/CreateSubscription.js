'use strict'

const yup = require('yup')
const Base = require('./Base')
const { ROLE_USER, ROLE_LANDLORD } = require('../constants')

class CreateSubscription extends Base {
  static schema = () =>
    yup.object().shape({
      product_id: yup.array().of(yup.string().required()).required(),
      quantity: yup.number().positive(),
    })
}

module.exports = CreateSubscription
