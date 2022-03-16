'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreatePlan extends Base {
  static schema = () =>
    yup.object().shape({
      name: yup.string(),
      description: yup.string(),
      prices: yup.number(),
    })
}

module.exports = CreatePlan
