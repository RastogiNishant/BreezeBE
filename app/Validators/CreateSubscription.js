'use strict'

const yup = require('yup')
const Base = require('./Base')
const UnitSubscription = require('./UnitSubscription')
const { ROLE_USER, ROLE_LANDLORD } = require('../constants')

class CreateSubscription extends Base {
  static schema = () =>
    yup.object().shape({
      subscriptions: yup.array().of(UnitSubscription.schema()).required(),
    })
}

module.exports = CreateSubscription
