'use strict'

const yup = require('yup')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class SlotId extends Base {
  static schema = () =>
    yup.object().shape({
      slot_id: id.required(),
    })
}

module.exports = SlotId
