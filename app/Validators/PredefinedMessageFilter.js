'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE,
  PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE,
  PREDEFINED_MSG_OPEN_ENDED,
  PREDEFINED_NOT_A_QUESTION,
  PREDEFINED_LAST,
} = require('../constants')

class PredefinedMessageFilter extends Base {
  static schema = () =>
    yup.object().shape({
      type: yup
        .array()
        .of(
          yup
            .number()
            .oneOf([
              PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE,
              PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE,
              PREDEFINED_MSG_OPEN_ENDED,
              PREDEFINED_NOT_A_QUESTION,
              PREDEFINED_LAST,
            ])
        )
        .nullable(),
      step: yup.number().integer()
    })
}

module.exports = PredefinedMessageFilter
