'use strict'

const yup = require('yup')
const {
  getExceptionMessage,
  exceptionKeys: { REQUIRED, POSITIVE_NUMBER },
} = require('../exceptions.js')
const { id } = require('../Libs/schemas.js')
const Base = require('./Base')

class SlotId extends Base {
  static schema = () =>
    yup.object().shape({
      slot_id: id
        .required(getExceptionMessage('slot_id', REQUIRED))
        .typeError(getExceptionMessage('slot_id', POSITIVE_NUMBER)),
    })
}

module.exports = SlotId
