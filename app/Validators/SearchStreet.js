'use strict'

const yup = require('yup')
const Base = require('./Base')

class SearchStreet extends Base {
  static schema = () =>
    yup.object().shape({
      query: yup.string().required().min(3),
    })
}

module.exports = SearchStreet
