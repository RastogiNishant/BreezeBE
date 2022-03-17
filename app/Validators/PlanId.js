'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class PlanId extends Base {
  static schema = () =>
    yup.object().shape({
      plan_id: id,
    })
}

module.exports = PlanId
