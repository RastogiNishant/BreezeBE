'use strict'

const yup = require('yup')
const Base = require('./Base')

class PredefinedMessageChoiceFilter extends Base {
  static schema = () =>
    yup.object().shape({
      predefined_message_id:yup.number().integer(),
      next_predefined_message_id: yup.number().integer(),
      include_reason: yup.boolean(),
    })
}

module.exports = PredefinedMessageChoiceFilter
