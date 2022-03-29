'use strict'

const yup = require('yup')
const Base = require('./Base')

class InitializeAdults extends Base {
  static schema = () =>
    yup.object().shape({
      selected_adults_count: yup.number().min(1).max(5).required(),
    })
}

module.exports = InitializeAdults
