'use strict'

const yup = require('yup')
const Base = require('./Base')
const {
  PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE,
  PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE,
  PREDEFINED_MSG_OPEN_ENDED,
  PREDEFINED_NOT_A_QUESTION,
  PREDEFINED_LAST,
  STATUS_ACTIVE,
  STATUS_DRAFT,
  STATUS_DELETE,
} = require('../constants')

class CreatePredefinedMessage extends Base {
  static schema = () =>
    yup.object().shape({
      text: yup.string().required(),
      type: yup
        .number()
        .oneOf([
          PREDEFINED_MSG_MULTIPLE_ANSWER_MULTIPLE_CHOICE,
          PREDEFINED_MSG_MULTIPLE_ANSWER_SIGNLE_CHOICE,
          PREDEFINED_MSG_OPEN_ENDED,
          PREDEFINED_NOT_A_QUESTION,
          PREDEFINED_LAST,
        ])
        .required(),
      variable_to_update: yup.string(),
      step: yup.number().integer().required(),
      status: yup.number().oneOf([STATUS_ACTIVE, STATUS_DRAFT, STATUS_DELETE]),
    })
}

module.exports = CreatePredefinedMessage
