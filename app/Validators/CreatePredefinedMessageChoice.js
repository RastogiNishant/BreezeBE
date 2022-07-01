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

class CreatePredefinedMessageChoice extends Base {
  static schema = () =>
    yup.object().shape({
      text: yup.string().required(),
      predefined_message_id: yup.number().integer().required(),
      next_predefined_message_id: yup.number().integer().nullable(),
    })
}

module.exports = CreatePredefinedMessageChoice
