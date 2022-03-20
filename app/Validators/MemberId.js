'use strict'

const yup = require('yup')
const Base = require('./Base')
const { id } = require('../Libs/schemas.js')

class MemberId extends Base {
  static schema = () =>
    yup.object().shape({
      member_id: id,
    })
}

module.exports = MemberId
