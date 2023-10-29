'use strict'

const yup = require('yup')
const Base = require('./Base')

class RecalculateMatchByDate extends Base {
  static schema = () =>
    yup.object().shape({
      date: yup.date()
    })
}

module.exports = RecalculateMatchByDate
