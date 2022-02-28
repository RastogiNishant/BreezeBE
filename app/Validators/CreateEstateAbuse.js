'use strict'

const yup = require('yup')
const Base = require('./Base')

class CreateEstateAbuse extends Base {
  static schema = () =>
    yup.object().shape({
      estate_id: yup.number().integer().positive(),
      abuse: yup.string().required(),
    })
}

module.exports = CreateEstateAbuse
