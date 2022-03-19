'use strict'

const yup = require('yup')
const Base = require('./Base')

class CalcRentPrice extends Base {
  static schema = () =>
    yup.object().shape({
      year: yup.number().min(1600).max(2050).required(),
      sqr: yup.number().positive().max(10000).required(),
      address: yup.string().matches(
        /^([A-Za-zÀ-ž\u0370-\u03FF\u0400-\u04FF\-\s\(\)]*)\s*(\d*)(,?)\s?(\d*)/i).required(),
    })
}

module.exports = CalcRentPrice
