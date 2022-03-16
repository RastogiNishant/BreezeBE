'use strict'

const yup = require('yup')
const Base = require('./Base')

class CalcRentPrice extends Base {
  static schema = () =>
    yup.object().shape({
      year: yup.number().min(1600).max(2050).required(),
      sqr: yup.number().positive().max(10000).required(),
      address: yup.string().required(),
    })
}

module.exports = CalcRentPrice
